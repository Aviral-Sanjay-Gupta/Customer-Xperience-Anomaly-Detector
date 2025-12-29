"""I/O utilities for loading and saving data."""

import os
from pathlib import Path
from typing import Optional

import pandas as pd
from loguru import logger

from src.telemetry import get_logger

log = get_logger(__name__)


def load_csv(path: str, **kwargs) -> pd.DataFrame:
    """
    Load CSV file from local filesystem or S3.
    
    Args:
        path: Local file path or S3 URI (s3://bucket/key)
        **kwargs: Additional arguments passed to pd.read_csv
    
    Returns:
        DataFrame with loaded data
    """
    log.info(f"Loading CSV from: {path}")
    
    if path.startswith("s3://"):
        # TODO: Implement S3 loading with boto3
        raise NotImplementedError("S3 loading not yet implemented. Use local paths.")
    
    df = pd.read_csv(path, **kwargs)
    log.info(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    
    return df


def save_csv(df: pd.DataFrame, path: str, **kwargs) -> None:
    """
    Save DataFrame to CSV (local or S3).
    
    Args:
        df: DataFrame to save
        path: Local file path or S3 URI
        **kwargs: Additional arguments passed to df.to_csv
    """
    log.info(f"Saving {len(df)} rows to: {path}")
    
    # Ensure directory exists for local paths
    if not path.startswith("s3://"):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
    
    if path.startswith("s3://"):
        # TODO: Implement S3 saving with boto3
        raise NotImplementedError("S3 saving not yet implemented. Use local paths.")
    
    df.to_csv(path, index=False, **kwargs)
    log.info(f"Saved successfully to {path}")


def load_from_s3(bucket: str, key: str) -> pd.DataFrame:
    """
    Load CSV from S3 bucket (placeholder for future implementation).
    
    Args:
        bucket: S3 bucket name
        key: Object key
    
    Returns:
        DataFrame with loaded data
    """
    import boto3
    from io import StringIO
    
    log.info(f"Loading from S3: s3://{bucket}/{key}")
    
    s3_client = boto3.client("s3")
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    df = pd.read_csv(StringIO(obj["Body"].read().decode("utf-8")))
    
    log.info(f"Loaded {len(df)} rows from S3")
    return df


def save_to_s3(df: pd.DataFrame, bucket: str, key: str) -> None:
    """
    Save DataFrame to S3 bucket (placeholder for future implementation).
    
    Args:
        df: DataFrame to save
        bucket: S3 bucket name
        key: Object key
    """
    import boto3
    from io import StringIO
    
    log.info(f"Saving to S3: s3://{bucket}/{key}")
    
    csv_buffer = StringIO()
    df.to_csv(csv_buffer, index=False)
    
    s3_client = boto3.client("s3")
    s3_client.put_object(Bucket=bucket, Key=key, Body=csv_buffer.getvalue())
    
    log.info(f"Saved {len(df)} rows to S3")


def load_from_minio(endpoint: str, access_key: str, secret_key: str, 
                    bucket: str, key: str, secure: bool = False) -> pd.DataFrame:
    """
    Load CSV from MinIO (S3-compatible storage).
    
    Args:
        endpoint: MinIO endpoint (e.g., 'localhost:9000')
        access_key: Access key
        secret_key: Secret key
        bucket: Bucket name
        key: Object key
        secure: Use HTTPS
    
    Returns:
        DataFrame with loaded data
    """
    from minio import Minio
    from io import BytesIO
    
    log.info(f"Loading from MinIO: {bucket}/{key}")
    
    client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)
    
    response = client.get_object(bucket, key)
    df = pd.read_csv(BytesIO(response.read()))
    response.close()
    response.release_conn()
    
    log.info(f"Loaded {len(df)} rows from MinIO")
    return df


def save_to_minio(df: pd.DataFrame, endpoint: str, access_key: str, secret_key: str,
                  bucket: str, key: str, secure: bool = False) -> None:
    """
    Save DataFrame to MinIO.
    
    Args:
        df: DataFrame to save
        endpoint: MinIO endpoint
        access_key: Access key
        secret_key: Secret key
        bucket: Bucket name
        key: Object key
        secure: Use HTTPS
    """
    from minio import Minio
    from io import BytesIO
    
    log.info(f"Saving to MinIO: {bucket}/{key}")
    
    client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)
    
    # Ensure bucket exists
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    client.put_object(bucket, key, BytesIO(csv_bytes), length=len(csv_bytes))
    
    log.info(f"Saved {len(df)} rows to MinIO")
