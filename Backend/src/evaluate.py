"""Evaluate trained anomaly detection models with comparison."""

import argparse
import os
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from dotenv import load_dotenv
from scipy.stats import pearsonr

from src.features import prepare_features, validate_schema
from src.io_utils import load_csv
from src.telemetry import get_logger, setup_logging

load_dotenv()

log = get_logger(__name__)


def load_artifacts(config: dict) -> dict:
    """
    Load trained model artifacts for all models.
    
    Args:
        config: Configuration dictionary
    
    Returns:
        Dictionary with preprocessor, models, and metadata
    """
    artifacts_dir = config["artifacts"]["dir"]
    
    log.info(f"Loading artifacts from: {artifacts_dir}")
    
    # Load shared preprocessor
    preprocessor_path = Path(artifacts_dir) / config["artifacts"]["preprocessor"]
    preprocessor = joblib.load(preprocessor_path)
    
    # Load each model and its metadata
    models = {}
    metadata = {}
    model_template = config["artifacts"]["model_template"]
    meta_template = config["artifacts"]["meta_template"]
    
    for model_config in config["models"]:
        model_name = model_config["name"]
        
        # Load model
        model_path = Path(artifacts_dir) / model_template.format(name=model_name)
        models[model_name] = joblib.load(model_path)
        
        # Load metadata
        meta_path = Path(artifacts_dir) / meta_template.format(name=model_name)
        metadata[model_name] = joblib.load(meta_path)
    
    # Load global metadata
    global_meta_path = Path(artifacts_dir) / "meta_global.joblib"
    metadata["global"] = joblib.load(global_meta_path)
    
    log.info(f"Artifacts loaded successfully for models: {list(models.keys())}")
    
    return {
        "preprocessor": preprocessor,
        "models": models,
        "metadata": metadata,
    }


def evaluate_models(config: dict, artifacts: dict) -> pd.DataFrame:
    """
    Evaluate all models on training data and generate comparison scores.
    
    Args:
        config: Configuration dictionary
        artifacts: Dictionary with preprocessor, models, and metadata
    
    Returns:
        DataFrame with scores from all models
    """
    # Load training data for evaluation
    train_path = config["data"]["train_path"]
    log.info(f"Loading training data from: {train_path}")
    df = load_csv(train_path)
    
    # Validate and prepare features
    validate_schema(df, config["features"])
    feature_df, identifier_cols = prepare_features(df, config["features"], is_training=False)
    
    # Transform features
    log.info("Transforming features...")
    X = artifacts["preprocessor"].transform(feature_df)
    
    # Score with each model
    results_df = pd.DataFrame()
    
    # Add identifier columns first
    for col in identifier_cols:
        if col in df.columns:
            results_df[col] = df[col].values
    
    # Score with each model
    for model_name, model in artifacts["models"].items():
        log.info(f"Computing scores for {model_name}...")
        metadata = artifacts["metadata"][model_name]
        algorithm = metadata["algorithm"]
        threshold = metadata["threshold"]
        
        # Get scores based on algorithm
        if algorithm == "IsolationForest":
            scores = -model.score_samples(X)  # Negate to make higher = more anomalous
        elif algorithm == "LOF":
            # For LOF with novelty=True, use score_samples (negative scores, so negate)
            scores = -model.detector_.score_samples(X)
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        # Apply threshold
        is_anomaly = scores >= threshold
        
        # Add to results
        results_df[f"{model_name}_score"] = scores
        results_df[f"{model_name}_anomaly"] = is_anomaly
        
        # Log summary statistics
        log.info(f"{model_name} - Anomalies detected: {is_anomaly.sum()} ({100 * is_anomaly.mean():.2f}%)")
        log.info(f"{model_name} - Score stats: Min={scores.min():.4f}, Max={scores.max():.4f}, "
                 f"Mean={scores.mean():.4f}, Median={np.median(scores):.4f}")
    
    # Compute correlation between model scores
    model_names = list(artifacts["models"].keys())
    if len(model_names) == 2:
        score_cols = [f"{name}_score" for name in model_names]
        corr, pval = pearsonr(results_df[score_cols[0]], results_df[score_cols[1]])
        log.info(f"Score correlation between {model_names[0]} and {model_names[1]}: {corr:.4f} (p={pval:.4e})")
    
    log.info("=" * 60)
    log.info(f"Evaluation Summary - Total samples: {len(results_df)}")
    log.info("=" * 60)
    
    return results_df


def plot_score_distribution(results_df: pd.DataFrame, artifacts: dict, 
                            output_path: str, bins: int = 50) -> None:
    """
    Plot anomaly score distribution comparison for all models.
    
    Args:
        results_df: DataFrame with scores from all models
        artifacts: Dictionary with model metadata
        output_path: Path to save plot
        bins: Number of histogram bins
    """
    log.info(f"Creating score distribution comparison plot...")
    
    model_names = list(artifacts["models"].keys())
    n_models = len(model_names)
    
    # Create figure with subplots (2 rows per model)
    fig, axes = plt.subplots(n_models, 2, figsize=(16, 6 * n_models))
    
    # If only one model, wrap axes in list
    if n_models == 1:
        axes = [axes]
    
    for idx, model_name in enumerate(model_names):
        score_col = f"{model_name}_score"
        anomaly_col = f"{model_name}_anomaly"
        threshold = artifacts["metadata"][model_name]["threshold"]
        scores = results_df[score_col].values
        
        # Histogram of scores
        ax1 = axes[idx][0]
        ax1.hist(scores, bins=bins, color="skyblue", edgecolor="black", alpha=0.7)
        ax1.axvline(threshold, color="red", linestyle="--", linewidth=2, 
                   label=f"Threshold: {threshold:.4f}")
        ax1.set_xlabel("Anomaly Score")
        ax1.set_ylabel("Frequency")
        ax1.set_title(f"{model_name.upper()} - Anomaly Score Distribution")
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Box plot by anomaly status
        ax2 = axes[idx][1]
        results_df.boxplot(column=score_col, by=anomaly_col, ax=ax2)
        ax2.set_xlabel("Is Anomaly")
        ax2.set_ylabel("Anomaly Score")
        ax2.set_title(f"{model_name.upper()} - Scores by Classification")
        plt.sca(ax2)
        plt.xticks([1, 2], ["False", "True"])
    
    plt.suptitle("Multi-Model Anomaly Score Comparison", fontsize=16, y=0.995)
    plt.tight_layout()
    
    # Save plot
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    log.info(f"Comparison plot saved to: {output_path}")
    
    plt.close()


def main():
    """Main evaluation pipeline."""
    parser = argparse.ArgumentParser(description="Evaluate CX anomaly detection model")
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to configuration file",
    )
    args = parser.parse_args()
    
    # Setup logging
    log_level = os.getenv("LOG_LEVEL", "INFO")
    setup_logging(log_level=log_level)
    
    log.info("=" * 60)
    log.info("Starting CX Anomaly Detection Model Evaluation")
    log.info("=" * 60)
    
    try:
        # Load configuration
        from src.train import load_config
        config = load_config(args.config)
        
        # Load artifacts
        artifacts = load_artifacts(config)
        
        # Evaluate models
        results_df = evaluate_models(config, artifacts)
        
        # Plot score distribution
        plot_output = config["evaluation"]["plot_output"]
        bins = config["evaluation"]["bins"]
        plot_score_distribution(results_df, artifacts, plot_output, bins)
        
        log.info("Evaluation completed successfully!")
        
    except Exception as e:
        log.error(f"Evaluation failed with error: {e}")
        raise


if __name__ == "__main__":
    main()
