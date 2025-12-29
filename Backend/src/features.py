"""Feature engineering and preprocessing pipeline."""

from typing import List, Optional, Tuple

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, MinMaxScaler

from src.telemetry import get_logger

log = get_logger(__name__)


def build_preprocessor(
    numeric_features: List[str],
    categorical_features: List[str],
    numeric_strategy: str = "mean",
    scale_method: str = "standard",
    categorical_unknown: str = "ignore",
) -> ColumnTransformer:
    """
    Build a preprocessing pipeline for numeric and categorical features.
    
    Args:
        numeric_features: List of numeric column names
        categorical_features: List of categorical column names
        numeric_strategy: Imputation strategy for numeric features (mean, median, constant)
        scale_method: Scaling method (standard or minmax)
        categorical_unknown: How to handle unknown categories (ignore or error)
    
    Returns:
        Fitted ColumnTransformer
    """
    log.info(f"Building preprocessor with {len(numeric_features)} numeric, "
             f"{len(categorical_features)} categorical features")
    
    # Numeric pipeline: impute then scale
    scaler = StandardScaler() if scale_method == "standard" else MinMaxScaler()
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy=numeric_strategy)),
        ("scaler", scaler),
    ])
    
    # Categorical pipeline: impute with constant 'missing' then one-hot encode
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
        ("onehot", OneHotEncoder(handle_unknown=categorical_unknown, sparse_output=False)),
    ])
    
    # Combine pipelines
    transformers = []
    if numeric_features:
        transformers.append(("num", numeric_pipeline, numeric_features))
    if categorical_features:
        transformers.append(("cat", categorical_pipeline, categorical_features))
    
    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")
    
    return preprocessor


def prepare_features(
    df: pd.DataFrame,
    config: dict,
    is_training: bool = True,
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Prepare features for modeling by dropping identifier and unwanted columns.
    
    Args:
        df: Input DataFrame
        config: Feature configuration dict
        is_training: Whether this is training data (affects validation)
    
    Returns:
        Tuple of (feature_df, identifier_columns)
    """
    # Extract identifier columns to preserve
    identifier_cols = config.get("identifier_columns", ["interaction_id", "timestamp"])
    drop_cols = config.get("drop_columns", [])
    
    # Validate expected columns
    numeric_cols = config.get("numeric", [])
    categorical_cols = config.get("categorical", [])
    expected_cols = set(numeric_cols + categorical_cols + identifier_cols)
    
    missing_cols = expected_cols - set(df.columns)
    if missing_cols and is_training:
        log.warning(f"Missing expected columns: {missing_cols}")
    
    # Create feature DataFrame (exclude identifiers and drop columns)
    feature_cols = [c for c in df.columns if c not in identifier_cols and c not in drop_cols]
    feature_df = df[feature_cols].copy()
    
    log.info(f"Prepared {len(feature_df.columns)} feature columns from {len(df)} rows")
    
    return feature_df, identifier_cols


def validate_schema(df: pd.DataFrame, config: dict) -> bool:
    """
    Validate that DataFrame has expected columns.
    
    Args:
        df: Input DataFrame
        config: Configuration dict with feature definitions
    
    Returns:
        True if valid, raises ValueError otherwise
    """
    required_cols = (
        config.get("numeric", []) +
        config.get("categorical", []) +
        config.get("identifier_columns", [])
    )
    
    missing = set(required_cols) - set(df.columns)
    if missing:
        raise ValueError(f"DataFrame missing required columns: {missing}")
    
    log.info("Schema validation passed")
    return True


def get_feature_names(preprocessor: ColumnTransformer) -> List[str]:
    """
    Extract feature names from fitted preprocessor.
    
    Args:
        preprocessor: Fitted ColumnTransformer
    
    Returns:
        List of feature names after transformation
    """
    feature_names = []
    
    for name, transformer, columns in preprocessor.transformers_:
        if name == "remainder":
            continue
            
        if hasattr(transformer, "get_feature_names_out"):
            names = transformer.get_feature_names_out()
        else:
            names = columns
        
        feature_names.extend(names)
    
    return feature_names
