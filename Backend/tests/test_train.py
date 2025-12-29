"""Unit tests for training pipeline."""

import tempfile
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import IsolationForest

from src.train import load_config, save_artifacts, train_model


@pytest.fixture
def temp_config_file():
    """Create temporary config file."""
    config_content = """
data:
  train_path: "./data/input/mock_train.csv"
  inference_path: "./data/input/mock_inference.csv"
  output_dir: "./data/processed"

artifacts:
  dir: "./models/artifacts"
  preprocessor: "preprocessor.joblib"
  model: "model.joblib"
  meta: "meta.joblib"

features:
  numeric:
    - csat
    - ies
    - aht_seconds
  categorical:
    - channel
    - language
  drop_columns:
    - interaction_id
    - timestamp
  identifier_columns:
    - interaction_id
    - timestamp

preprocessing:
  numeric_strategy: "mean"
  scale_method: "standard"
  categorical_unknown: "ignore"

model:
  algorithm: "IsolationForest"
  params:
    n_estimators: 50
    contamination: 0.1
    random_state: 42
    n_jobs: 1
  threshold_percentile: 90

evaluation:
  plot_output: "./data/processed/score_distribution.png"
  bins: 50

batch:
  chunk_size: 1000
"""
    
    with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
        f.write(config_content)
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    Path(temp_path).unlink(missing_ok=True)


@pytest.fixture
def temp_training_data():
    """Create temporary training data CSV."""
    df = pd.DataFrame({
        "interaction_id": [f"id{i}" for i in range(50)],
        "timestamp": ["2025-01-01"] * 50,
        "csat": np.random.uniform(1, 5, 50),
        "ies": np.random.uniform(50, 100, 50),
        "aht_seconds": np.random.uniform(200, 600, 50),
        "channel": np.random.choice(["voice", "chat", "email"], 50),
        "language": np.random.choice(["en", "es", "fr"], 50),
    })
    
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        df.to_csv(f.name, index=False)
        temp_path = f.name
    
    yield temp_path
    
    Path(temp_path).unlink(missing_ok=True)


def test_load_config(temp_config_file):
    """Test config loading."""
    config = load_config(temp_config_file)
    
    assert "data" in config
    assert "features" in config
    assert "model" in config
    assert config["model"]["params"]["n_estimators"] == 50


def test_train_model_returns_artifacts(temp_config_file, temp_training_data, monkeypatch):
    """Test that training returns expected artifacts."""
    # Load config and update training path
    config = load_config(temp_config_file)
    config["data"]["train_path"] = temp_training_data
    
    # Mock load_csv to avoid file I/O
    def mock_load_config(path=None):
        return config
    
    monkeypatch.setattr("src.train.load_config", mock_load_config)
    
    # Train model
    preprocessor, model, metadata = train_model(config)
    
    # Check artifacts
    assert preprocessor is not None
    assert isinstance(model, IsolationForest)
    assert isinstance(metadata, dict)
    assert "threshold" in metadata
    assert "n_samples" in metadata
    assert metadata["n_samples"] == 50


def test_save_artifacts(temp_config_file, temp_training_data, monkeypatch):
    """Test artifact saving."""
    config = load_config(temp_config_file)
    config["data"]["train_path"] = temp_training_data
    
    def mock_load_config(path=None):
        return config
    
    monkeypatch.setattr("src.train.load_config", mock_load_config)
    
    # Create temporary artifacts directory
    with tempfile.TemporaryDirectory() as temp_dir:
        config["artifacts"]["dir"] = temp_dir
        
        # Train model
        preprocessor, model, metadata = train_model(config)
        
        # Save artifacts
        save_artifacts(preprocessor, model, metadata, config)
        
        # Check files exist
        assert Path(temp_dir, "preprocessor.joblib").exists()
        assert Path(temp_dir, "model.joblib").exists()
        assert Path(temp_dir, "meta.joblib").exists()
        
        # Load and verify
        loaded_model = joblib.load(Path(temp_dir, "model.joblib"))
        assert isinstance(loaded_model, IsolationForest)
