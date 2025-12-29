"""Train anomaly detection models on CX interaction data."""

import argparse
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import yaml
from dotenv import load_dotenv
from sklearn.ensemble import IsolationForest
from pyod.models.lof import LOF

from src.features import build_preprocessor, prepare_features, validate_schema
from src.io_utils import load_csv
from src.telemetry import get_logger, setup_logging

# Load environment variables
load_dotenv()

log = get_logger(__name__)


def load_config(config_path: str = None) -> dict:
    """
    Load configuration from YAML file.
    
    Args:
        config_path: Path to config file, or None to use env/default
    
    Returns:
        Configuration dictionary
    """
    if config_path is None:
        config_path = os.getenv("CONFIG_PATH", "./configs/config.local.yaml")
    
    log.info(f"Loading configuration from: {config_path}")
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    
    return config


def train_models(config: dict) -> dict:
    """
    Train multiple anomaly detection models and shared preprocessing pipeline.
    
    Args:
        config: Configuration dictionary
    
    Returns:
        Dictionary with keys: preprocessor, models (dict), metadata (dict)
    """
    # Load training data
    train_path = config["data"]["train_path"]
    log.info(f"Loading training data from: {train_path}")
    df = load_csv(train_path)
    
    # Validate schema
    validate_schema(df, config["features"])
    
    # Prepare features
    feature_df, identifier_cols = prepare_features(df, config["features"], is_training=True)
    
    # Build and fit preprocessor (shared across all models)
    numeric_features = config["features"]["numeric"]
    categorical_features = config["features"]["categorical"]
    numeric_strategy = config["preprocessing"]["numeric_strategy"]
    scale_method = config["preprocessing"]["scale_method"]
    categorical_unknown = config["preprocessing"]["categorical_unknown"]
    
    preprocessor = build_preprocessor(
        numeric_features=numeric_features,
        categorical_features=categorical_features,
        numeric_strategy=numeric_strategy,
        scale_method=scale_method,
        categorical_unknown=categorical_unknown,
    )
    
    log.info("Fitting preprocessor on training data...")
    X_train = preprocessor.fit_transform(feature_df)
    log.info(f"Transformed features shape: {X_train.shape}")
    
    # Train each configured model
    models = {}
    metadata = {}
    
    for model_config in config["models"]:
        model_name = model_config["name"]
        algorithm = model_config["algorithm"]
        model_params = model_config["params"]
        threshold_percentile = model_config["threshold_percentile"]
        
        log.info(f"Training {algorithm} ({model_name}) with params: {model_params}")
        
        # Initialize model based on algorithm
        if algorithm == "IsolationForest":
            model = IsolationForest(**model_params)
            model.fit(X_train)
            # score_samples returns negative values (lower = more anomalous)
            # Negate to make higher scores = more anomalous
            train_scores = -model.score_samples(X_train)
        elif algorithm == "LOF":
            model = LOF(**model_params)
            model.fit(X_train)
            # LOF: Use negative_outlier_factor_ for training data, invert so higher = more anomalous
            train_scores = -model.detector_.negative_outlier_factor_
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        # Determine threshold at specified percentile
        threshold = np.percentile(train_scores, threshold_percentile)
        
        log.info(f"{model_name} - Anomaly score threshold (p{threshold_percentile}): {threshold:.4f}")
        log.info(f"{model_name} - Score distribution - Min: {train_scores.min():.4f}, "
                 f"Max: {train_scores.max():.4f}, Mean: {train_scores.mean():.4f}")
        
        # Store model and metadata
        models[model_name] = model
        metadata[model_name] = {
            "algorithm": algorithm,
            "train_timestamp": datetime.now(timezone.utc).isoformat(),
            "n_samples": len(df),
            "n_features": X_train.shape[1],
            "threshold": float(threshold),
            "threshold_percentile": threshold_percentile,
            "model_params": model_params,
            "score_stats": {
                "min": float(train_scores.min()),
                "max": float(train_scores.max()),
                "mean": float(train_scores.mean()),
                "std": float(train_scores.std()),
            },
        }
    
    # Add global metadata
    metadata["global"] = {
        "train_timestamp": datetime.now(timezone.utc).isoformat(),
        "n_samples": len(df),
        "n_features": X_train.shape[1],
        "models_trained": list(models.keys()),
        "config_snapshot": config,
    }
    
    return {
        "preprocessor": preprocessor,
        "models": models,
        "metadata": metadata,
    }


def save_artifacts(artifacts: dict, config: dict) -> None:
    """
    Save trained artifacts to disk.
    
    Args:
        artifacts: Dictionary with preprocessor, models, and metadata
        config: Configuration dictionary
    """
    artifacts_dir = config["artifacts"]["dir"]
    Path(artifacts_dir).mkdir(parents=True, exist_ok=True)
    
    # Save preprocessor (shared)
    preprocessor_path = Path(artifacts_dir) / config["artifacts"]["preprocessor"]
    log.info(f"Saving preprocessor to: {preprocessor_path}")
    joblib.dump(artifacts["preprocessor"], preprocessor_path)
    
    # Save each model and its metadata
    model_template = config["artifacts"]["model_template"]
    meta_template = config["artifacts"]["meta_template"]
    
    for model_name, model in artifacts["models"].items():
        # Save model
        model_path = Path(artifacts_dir) / model_template.format(name=model_name)
        log.info(f"Saving {model_name} model to: {model_path}")
        joblib.dump(model, model_path)
        
        # Save model-specific metadata
        meta_path = Path(artifacts_dir) / meta_template.format(name=model_name)
        log.info(f"Saving {model_name} metadata to: {meta_path}")
        joblib.dump(artifacts["metadata"][model_name], meta_path)
    
    # Save global metadata
    global_meta_path = Path(artifacts_dir) / "meta_global.joblib"
    log.info(f"Saving global metadata to: {global_meta_path}")
    joblib.dump(artifacts["metadata"]["global"], global_meta_path)
    
    log.info("All artifacts saved successfully")


def main():
    """Main training pipeline."""
    parser = argparse.ArgumentParser(description="Train CX anomaly detection model")
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to configuration file (overrides CONFIG_PATH env var)",
    )
    args = parser.parse_args()
    
    # Setup logging
    log_level = os.getenv("LOG_LEVEL", "INFO")
    setup_logging(log_level=log_level)
    
    log.info("=" * 60)
    log.info("Starting CX Anomaly Detection Model Training")
    log.info("=" * 60)
    
    try:
        # Load configuration
        config = load_config(args.config)
        
        # Train models
        artifacts = train_models(config)
        
        # Save artifacts
        save_artifacts(artifacts, config)
        
        log.info("=" * 60)
        log.info("Training completed successfully!")
        log.info(f"Trained on {artifacts['metadata']['global']['n_samples']} samples")
        log.info(f"Generated {artifacts['metadata']['global']['n_features']} features")
        log.info(f"Models trained: {', '.join(artifacts['metadata']['global']['models_trained'])}")
        for model_name in artifacts['models'].keys():
            log.info(f"  {model_name} - Threshold: {artifacts['metadata'][model_name]['threshold']:.4f}")
        log.info("=" * 60)
        
    except Exception as e:
        log.error(f"Training failed with error: {e}")
        raise


if __name__ == "__main__":
    main()
