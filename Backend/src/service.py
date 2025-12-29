"""FastAPI service for real-time anomaly scoring with multi-model support."""

import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd

from src import __version__
from src.features import prepare_features
from src.schema import (
    AnomalyScore,
    BatchScoreResponse,
    HealthResponse,
    InteractionRecord,
)
from src.telemetry import get_logger, setup_logging
from src.train import load_config

load_dotenv()

# Setup logging
log_level = os.getenv("LOG_LEVEL", "INFO")
setup_logging(log_level=log_level)
log = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CX Anomaly Detector API",
    description="Real-time anomaly detection for customer experience metrics with multi-model support",
    version=__version__,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Global state for model artifacts
_model_state = {
    "preprocessor": None,
    "models": {},
    "metadata": {},
    "loaded_at": None,
    "config": None,
}


def load_model_artifacts():
    """Load all model artifacts into memory."""
    try:
        config = load_config()
        artifacts_dir = config["artifacts"]["dir"]
        
        log.info(f"Loading model artifacts from: {artifacts_dir}")
        
        # Load shared preprocessor
        preprocessor_path = Path(artifacts_dir) / config["artifacts"]["preprocessor"]
        _model_state["preprocessor"] = joblib.load(preprocessor_path)
        
        # Load each model and its metadata
        model_template = config["artifacts"]["model_template"]
        meta_template = config["artifacts"]["meta_template"]
        
        for model_config in config["models"]:
            model_name = model_config["name"]
            
            # Load model
            model_path = Path(artifacts_dir) / model_template.format(name=model_name)
            _model_state["models"][model_name] = joblib.load(model_path)
            
            # Load metadata
            meta_path = Path(artifacts_dir) / meta_template.format(name=model_name)
            _model_state["metadata"][model_name] = joblib.load(meta_path)
        
        _model_state["loaded_at"] = datetime.now(timezone.utc)
        _model_state["config"] = config
        
        log.info(f"Model artifacts loaded successfully for models: {list(_model_state['models'].keys())}")
        
    except Exception as e:
        log.error(f"Failed to load model artifacts: {e}")
        raise


def score_records(records: List[InteractionRecord], model_selection: str = "both") -> List[AnomalyScore]:
    """
    Score a batch of interaction records with selected models.
    
    Args:
        records: List of interaction records
        model_selection: Model to use ('iforest', 'lof', or 'both')
    
    Returns:
        List of anomaly scores with requested model results
    """
    # Check if models are loaded
    if not _model_state["models"]:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    # Normalize model selection and map aliases
    model_selection = model_selection.lower()
    model_map = {"lof": "lof"}  # lof is an alias for LOF
    
    # Validate model selection
    valid_selections = {"iforest", "lof", "lof", "both"}
    if model_selection not in valid_selections:
        raise HTTPException(
            status_code=400,
            detail="model must be one of: iforest, lof, both"
        )
    
    # Determine which models to compute
    if model_selection == "both":
        models_to_compute = ["iforest", "lof"]
    elif model_selection in model_map:
        models_to_compute = [model_map[model_selection]]
    else:
        models_to_compute = [model_selection]
    
    # Ensure requested models are available
    available_models = set(_model_state["models"].keys())
    for model_name in models_to_compute:
        if model_name not in available_models:
            raise HTTPException(
                status_code=503,
                detail=f"Model '{model_name}' not available"
            )
    
    # Convert to DataFrame
    records_data = [record.model_dump() for record in records]
    df = pd.DataFrame(records_data)
    
    # Prepare features
    config = _model_state["config"]
    feature_df, identifier_cols = prepare_features(df, config["features"], is_training=False)
    
    # Transform features
    preprocessor = _model_state["preprocessor"]
    X = preprocessor.transform(feature_df)
    
    # Storage for computed scores and flags
    computed_scores = {}
    computed_anomalies = {}
    
    # Compute requested models
    if "iforest" in models_to_compute:
        iforest_model = _model_state["models"]["iforest"]
        iforest_metadata = _model_state["metadata"]["iforest"]
        iforest_threshold = iforest_metadata["threshold"]
        iforest_scores = -iforest_model.score_samples(X)
        iforest_anomalies = (iforest_scores >= iforest_threshold).astype(int)
        computed_scores["iforest"] = iforest_scores
        computed_anomalies["iforest"] = iforest_anomalies
        log.info(f"IForest - Detected {iforest_anomalies.sum()} anomalies ({100 * iforest_anomalies.mean():.2f}%)")
    
    if "lof" in models_to_compute:
        lof_model = _model_state["models"]["lof"]
        lof_metadata = _model_state["metadata"]["lof"]
        lof_threshold = lof_metadata["threshold"]
        lof_scores = -lof_model.detector_.score_samples(X)
        lof_anomalies = (lof_scores >= lof_threshold).astype(int)
        computed_scores["lof"] = lof_scores
        computed_anomalies["lof"] = lof_anomalies
        log.info(f"LOF - Detected {lof_anomalies.sum()} anomalies ({100 * lof_anomalies.mean():.2f}%)")
    
    # Compute ensemble score and flag if both models requested
    if model_selection == "both" and "iforest" in computed_anomalies and "lof" in computed_anomalies:
        # Get ensemble configuration
        ensemble_config = config["ensemble"]
        weights = ensemble_config["weights"]
        iforest_weight = weights.get("iforest", 0.5)
        lof_weight = weights.get("lof", 0.5)
        
        # Normalize scores to [0, 1] range using training stats
        iforest_min = iforest_metadata["score_stats"]["min"]
        iforest_max = iforest_metadata["score_stats"]["max"]
        iforest_normalized = (computed_scores["iforest"] - iforest_min) / (iforest_max - iforest_min + 1e-10)
        iforest_normalized = np.clip(iforest_normalized, 0, 1)
        
        lof_min = lof_metadata["score_stats"]["min"]
        lof_max = lof_metadata["score_stats"]["max"]
        lof_normalized = (computed_scores["lof"] - lof_min) / (lof_max - lof_min + 1e-10)
        lof_normalized = np.clip(lof_normalized, 0, 1)
        
        # Weighted average of normalized scores
        ensemble_scores = iforest_weight * iforest_normalized + lof_weight * lof_normalized
        computed_scores["ensemble"] = ensemble_scores
        
        # Ensemble anomaly: OR of individual model anomalies
        ensemble_anomalies = np.logical_or(
            computed_anomalies["iforest"], 
            computed_anomalies["lof"]
        ).astype(int)
        computed_anomalies["ensemble"] = ensemble_anomalies
        log.info(f"Ensemble - Detected {ensemble_anomalies.sum()} anomalies ({100 * ensemble_anomalies.mean():.2f}%)")
    
    # Build response with selective fields based on model_selection
    results = []
    for i, record in enumerate(records):
        scores_dict = {}
        is_anomaly_dict = {}
        
        # Map internal model names to API names (lof -> lof for API)
        api_name_map = {"lof": "lof", "iforest": "iforest"}
        
        for internal_name, score_array in computed_scores.items():
            api_name = api_name_map.get(internal_name, internal_name)
            # Skip ensemble score in the scores dict, only include in is_anomaly
            if internal_name != "ensemble":
                scores_dict[api_name] = float(score_array[i])
                is_anomaly_dict[api_name] = int(computed_anomalies[internal_name][i])
        
        # Add ensemble flag and score if computed
        if "ensemble" in computed_anomalies:
            is_anomaly_dict["ensemble"] = int(computed_anomalies["ensemble"][i])
        if "ensemble" in computed_scores:
            scores_dict["ensemble"] = float(computed_scores["ensemble"][i])
        
        results.append(
            AnomalyScore(
                interaction_id=record.interaction_id,
                scores=scores_dict,
                is_anomaly=is_anomaly_dict,
            )
        )
    
    return results


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    log.info("Starting CX Anomaly Detector API...")
    try:
        load_model_artifacts()
        log.info("API ready to serve requests")
    except Exception as e:
        log.error(f"Failed to initialize API: {e}")
        # Allow startup to continue but mark model as unavailable


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    model_loaded = bool(_model_state["models"])
    
    return HealthResponse(
        status="healthy" if model_loaded else "degraded",
        timestamp=datetime.now(timezone.utc),
        model_loaded=model_loaded,
        version=__version__,
    )


@app.get("/models")
async def list_models():
    """List available models and their metadata."""
    if not _model_state["models"]:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    models_info = {}
    for model_name in _model_state["models"].keys():
        metadata = _model_state["metadata"][model_name]
        models_info[model_name] = {
            "algorithm": metadata["algorithm"],
            "threshold": metadata["threshold"],
            "train_timestamp": metadata["train_timestamp"],
            "n_samples": metadata["n_samples"],
            "n_features": metadata["n_features"],
        }
    
    return {
        "models": models_info,
        "ensemble_available": len(models_info) > 1,
        "loaded_at": _model_state["loaded_at"].isoformat() if _model_state["loaded_at"] else None,
    }


@app.post("/score", response_model=BatchScoreResponse)
async def score_interactions(
    records: List[InteractionRecord],
    model: str = Query(default="both", description="Model to use: 'iforest', 'lof', or 'both' (default)")
):
    """
    Score a batch of interaction records for anomalies.
    
    Args:
        records: List of interaction records to score
        model: Model selection ('iforest', 'lof', or 'both'). Default is 'both'.
    
    Returns:
        Batch score response with anomaly flags and scores for requested model(s)
    """
    start_time = time.time()
    
    try:
        log.info(f"Scoring {len(records)} records with model: {model}")
        
        # Score records (validation happens inside)
        scores = score_records(records, model_selection=model)
        
        # Calculate metrics - count anomalies based on what was requested
        # For single model: count that model's anomalies
        # For both: count ensemble anomalies
        anomalies_detected = 0
        for s in scores:
            if "ensemble" in s.is_anomaly:
                anomalies_detected += s.is_anomaly["ensemble"]
            else:
                # Single model case - count if any model flagged as anomaly
                anomalies_detected += max(s.is_anomaly.values())
        
        processing_time_ms = (time.time() - start_time) * 1000
        
        log.info(f"Scored {len(records)} records in {processing_time_ms:.2f}ms, "
                 f"detected {anomalies_detected} anomalies (model={model})")
        
        return BatchScoreResponse(
            scores=scores,
            total_records=len(records),
            anomalies_detected=anomalies_detected,
            processing_time_ms=processing_time_ms,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Scoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reload")
async def reload_model():
    """Reload model artifacts (useful for updates)."""
    try:
        log.info("Reloading model artifacts...")
        load_model_artifacts()
        return {"status": "success", "message": "Model reloaded successfully"}
    except Exception as e:
        log.error(f"Failed to reload model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "CX Anomaly Detector",
        "version": __version__,
        "endpoints": {
            "health": "/health",
            "models": "/models",
            "score": "/score",
            "reload": "/reload",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    
    log.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
