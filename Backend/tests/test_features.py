"""Unit tests for feature engineering."""

import numpy as np
import pandas as pd
import pytest
from sklearn.compose import ColumnTransformer

from src.features import (
    build_preprocessor,
    get_feature_names,
    prepare_features,
    validate_schema,
)


@pytest.fixture
def sample_config():
    """Sample configuration for testing."""
    return {
        "numeric": ["csat", "ies", "aht_seconds"],
        "categorical": ["channel", "language"],
        "drop_columns": ["interaction_id", "timestamp"],
        "identifier_columns": ["interaction_id", "timestamp"],
    }


@pytest.fixture
def sample_data():
    """Sample DataFrame for testing."""
    return pd.DataFrame({
        "interaction_id": ["id1", "id2", "id3"],
        "timestamp": ["2025-01-01", "2025-01-02", "2025-01-03"],
        "csat": [4.5, 3.2, None],
        "ies": [80.0, 65.0, 70.0],
        "aht_seconds": [300, 450, 350],
        "channel": ["voice", "chat", "voice"],
        "language": ["en", "es", "en"],
    })


def test_build_preprocessor(sample_config):
    """Test preprocessor construction."""
    preprocessor = build_preprocessor(
        numeric_features=sample_config["numeric"],
        categorical_features=sample_config["categorical"],
    )
    
    assert isinstance(preprocessor, ColumnTransformer)
    assert len(preprocessor.transformers) == 2  # numeric + categorical


def test_prepare_features(sample_data, sample_config):
    """Test feature preparation."""
    feature_df, identifier_cols = prepare_features(sample_data, sample_config)
    
    # Should exclude identifiers
    assert "interaction_id" not in feature_df.columns
    assert "timestamp" not in feature_df.columns
    
    # Should include feature columns
    assert "csat" in feature_df.columns
    assert "channel" in feature_df.columns
    
    # Check identifier columns returned
    assert "interaction_id" in identifier_cols


def test_validate_schema_valid(sample_data, sample_config):
    """Test schema validation with valid data."""
    assert validate_schema(sample_data, sample_config) is True


def test_validate_schema_missing_columns(sample_config):
    """Test schema validation with missing columns."""
    incomplete_df = pd.DataFrame({"csat": [4.5], "ies": [80.0]})
    
    with pytest.raises(ValueError, match="missing required columns"):
        validate_schema(incomplete_df, sample_config)


def test_preprocessor_fit_transform(sample_data, sample_config):
    """Test fitting and transforming with preprocessor."""
    feature_df, _ = prepare_features(sample_data, sample_config)
    
    preprocessor = build_preprocessor(
        numeric_features=sample_config["numeric"],
        categorical_features=sample_config["categorical"],
    )
    
    X = preprocessor.fit_transform(feature_df)
    
    # Should produce numeric array
    assert isinstance(X, np.ndarray)
    assert X.shape[0] == len(feature_df)
    assert X.shape[1] > 0  # Should have features


def test_preprocessor_handles_missing_values(sample_config):
    """Test that preprocessor handles missing values."""
    df_with_nulls = pd.DataFrame({
        "csat": [4.5, None, 3.2],
        "ies": [80.0, 65.0, None],
        "aht_seconds": [300, 450, 350],
        "channel": ["voice", None, "chat"],
        "language": ["en", "es", None],
    })
    
    preprocessor = build_preprocessor(
        numeric_features=sample_config["numeric"],
        categorical_features=sample_config["categorical"],
    )
    
    X = preprocessor.fit_transform(df_with_nulls)
    
    # Should not contain NaN
    assert not np.isnan(X).any()
