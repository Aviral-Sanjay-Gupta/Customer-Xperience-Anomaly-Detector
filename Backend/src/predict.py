"""Batch prediction on inference data with multi-model support."""

import argparse
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv

from src.features import prepare_features
from src.io_utils import load_csv, save_csv
from src.telemetry import get_logger, setup_logging
from src.train import load_config

load_dotenv()

log = get_logger(__name__)


def load_artifacts(config: dict, model_name: str = None) -> dict:
    """
    Load trained model artifacts.
    
    Args:
        config: Configuration dictionary
        model_name: Specific model to load, or None to load all
    
    Returns:
        Dictionary with preprocessor, models, and metadata
    """
    artifacts_dir = config["artifacts"]["dir"]
    
    log.info(f"Loading artifacts from: {artifacts_dir}")
    
    # Load shared preprocessor
    preprocessor_path = Path(artifacts_dir) / config["artifacts"]["preprocessor"]
    preprocessor = joblib.load(preprocessor_path)
    
    # Determine which models to load
    if model_name:
        # Validate model name
        valid_names = [m["name"] for m in config["models"]]
        if model_name not in valid_names:
            raise ValueError(f"Invalid model name '{model_name}'. Valid options: {valid_names}")
        models_to_load = [model_name]
    else:
        models_to_load = [m["name"] for m in config["models"]]
    
    # Load each model and its metadata
    models = {}
    metadata = {}
    model_template = config["artifacts"]["model_template"]
    meta_template = config["artifacts"]["meta_template"]
    
    for name in models_to_load:
        # Load model
        model_path = Path(artifacts_dir) / model_template.format(name=name)
        models[name] = joblib.load(model_path)
        
        # Load metadata
        meta_path = Path(artifacts_dir) / meta_template.format(name=name)
        metadata[name] = joblib.load(meta_path)
    
    log.info(f"Loaded models: {list(models.keys())}")
    
    return {
        "preprocessor": preprocessor,
        "models": models,
        "metadata": metadata,
    }


def predict_batch(config: dict, artifacts: dict, model_selection: str = "ensemble") -> pd.DataFrame:
    """
    Run batch prediction on inference data returning all model results.
    
    Args:
        config: Configuration dictionary
        artifacts: Dictionary with preprocessor, models, and metadata
        model_selection: Legacy parameter, now always returns all models
    
    Returns:
        DataFrame with 7 columns: interaction_id, iforest_score, iforest_anomaly, 
        lof_score, lof_anomaly, ensemble_score, ensemble_anomaly
    """
    # Load inference data
    inference_path = config["data"]["inference_path"]
    log.info(f"Loading inference data from: {inference_path}")
    df = load_csv(inference_path)
    
    log.info(f"Loaded {len(df)} records for scoring")
    
    # Ensure we have both required models
    required_models = {"iforest", "lof"}
    available_models = set(artifacts["models"].keys())
    if not required_models.issubset(available_models):
        missing = required_models - available_models
        raise ValueError(f"Required models not available: {missing}")
    
    # Prepare features (preserve identifiers)
    feature_df, identifier_cols = prepare_features(df, config["features"], is_training=False)
    
    # Transform features
    log.info("Transforming features...")
    X = artifacts["preprocessor"].transform(feature_df)
    
    # Score with IForest
    log.info("Computing IForest scores...")
    iforest_model = artifacts["models"]["iforest"]
    iforest_metadata = artifacts["metadata"]["iforest"]
    iforest_threshold = iforest_metadata["threshold"]
    iforest_scores = -iforest_model.score_samples(X)
    iforest_anomalies = iforest_scores >= iforest_threshold
    
    log.info(f"IForest - Detected {iforest_anomalies.sum()} anomalies "
             f"({100 * iforest_anomalies.mean():.2f}%)")
    
    # Score with LOF
    log.info("Computing LOF scores...")
    lof_model = artifacts["models"]["lof"]
    lof_metadata = artifacts["metadata"]["lof"]
    lof_threshold = lof_metadata["threshold"]
    lof_scores = -lof_model.detector_.score_samples(X)
    lof_anomalies = lof_scores >= lof_threshold
    
    log.info(f"LOF - Detected {lof_anomalies.sum()} anomalies "
             f"({100 * lof_anomalies.mean():.2f}%)")
    
    # Compute ensemble score (normalized weighted average)
    log.info("Computing ensemble scores...")
    ensemble_config = config["ensemble"]
    weights = ensemble_config["weights"]
    iforest_weight = weights.get("iforest", 0.5)
    lof_weight = weights.get("lof", 0.5)
    
    # Normalize scores to [0, 1] range using training stats
    iforest_min = iforest_metadata["score_stats"]["min"]
    iforest_max = iforest_metadata["score_stats"]["max"]
    iforest_normalized = (iforest_scores - iforest_min) / (iforest_max - iforest_min + 1e-10)
    iforest_normalized = np.clip(iforest_normalized, 0, 1)
    
    lof_min = lof_metadata["score_stats"]["min"]
    lof_max = lof_metadata["score_stats"]["max"]
    lof_normalized = (lof_scores - lof_min) / (lof_max - lof_min + 1e-10)
    lof_normalized = np.clip(lof_normalized, 0, 1)
    
    # Weighted average
    ensemble_scores = iforest_weight * iforest_normalized + lof_weight * lof_normalized
    
    # Ensemble anomaly: OR of individual model anomalies
    ensemble_anomalies = np.logical_or(iforest_anomalies, lof_anomalies)
    
    log.info(f"Ensemble - Detected {ensemble_anomalies.sum()} anomalies "
             f"({100 * ensemble_anomalies.mean():.2f}%)")
    
    # Build results DataFrame with 7 required columns
    results = {
        "interaction_id": df["interaction_id"].values,
        "iforest_score": iforest_scores,
        "iforest_anomaly": iforest_anomalies,
        "lof_score": lof_scores,
        "lof_anomaly": lof_anomalies,
        "ensemble_score": ensemble_scores,
        "ensemble_anomaly": ensemble_anomalies,
    }
    
    # Add timestamp if present
    if "timestamp" in df.columns:
        results = {"timestamp": df["timestamp"].values, **results}
    
    results_df = pd.DataFrame(results)
    
    return results_df


def save_predictions(results_df: pd.DataFrame, config: dict, model_selection: str = "ensemble") -> str:
    """
    Save predictions to output directory.
    
    Args:
        results_df: DataFrame with predictions
        config: Configuration dictionary
        model_selection: Model selection used
    
    Returns:
        Path to saved file
    """
    output_dir = config["data"]["output_dir"]
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_path = Path(output_dir) / f"anomalies_{model_selection}_{timestamp}.csv"
    
    log.info(f"Saving predictions to: {output_path}")
    save_csv(results_df, str(output_path))
    
    return str(output_path)


def main():
    """Main batch prediction pipeline."""
    parser = argparse.ArgumentParser(description="Batch anomaly scoring with multi-model support")
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to configuration file",
    )
    parser.add_argument(
        "--input",
        type=str,
        default=None,
        help="Override input data path",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Override output path",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="ensemble",
        help="Model selection: 'ensemble', 'iforest', 'rcf', or other configured model name",
    )
    args = parser.parse_args()
    
    # Setup logging
    log_level = os.getenv("LOG_LEVEL", "INFO")
    setup_logging(log_level=log_level)
    
    log.info("=" * 60)
    log.info("Starting Batch Anomaly Scoring")
    log.info(f"Model selection: {args.model}")
    log.info("=" * 60)
    
    try:
        # Load configuration
        config = load_config(args.config)
        
        # Override paths if provided
        if args.input:
            config["data"]["inference_path"] = args.input
        if args.output:
            config["data"]["output_dir"] = args.output
        
        # Load artifacts (all models or specific one)
        model_name = args.model if args.model != "ensemble" else None
        artifacts = load_artifacts(config, model_name=model_name)
        
        # Run predictions
        results_df = predict_batch(config, artifacts, model_selection=args.model)
        
        # Save results
        output_path = save_predictions(results_df, config, model_selection=args.model)
        
        log.info("=" * 60)
        log.info("Batch scoring completed successfully!")
        log.info(f"Results saved to: {output_path}")
        log.info("=" * 60)
        
    except Exception as e:
        log.error(f"Batch scoring failed with error: {e}")
        raise


if __name__ == "__main__":
    main()
