"""Unit tests for FastAPI service."""

import pytest
from fastapi.testclient import TestClient

# Note: These tests assume model artifacts exist
# In a real setup, you'd mock the model loading


@pytest.fixture
def mock_model_state(monkeypatch):
    """Mock model state for testing with multi-model support."""
    import numpy as np
    from unittest.mock import MagicMock
    
    # Create mock objects
    mock_preprocessor = MagicMock()
    mock_preprocessor.transform.return_value = np.array([[1.0, 2.0, 3.0]])
    
    mock_iforest = MagicMock()
    mock_iforest.score_samples.return_value = np.array([-0.5])
    
    mock_lof = MagicMock()
    mock_lof_detector = MagicMock()
    mock_lof_detector.score_samples.return_value = np.array([-0.6])
    mock_lof.detector_ = mock_lof_detector
    
    mock_iforest_metadata = {
        "threshold": 0.4,
        "train_timestamp": "2025-01-01T00:00:00",
        "algorithm": "IsolationForest",
        "n_samples": 1000,
        "n_features": 10,
    }
    
    mock_lof_metadata = {
        "threshold": 0.5,
        "train_timestamp": "2025-01-01T00:00:00",
        "algorithm": "LOF",
        "n_samples": 1000,
        "n_features": 10,
    }
    
    mock_config = {
        "features": {
            "numeric": ["csat", "ies", "aht_seconds"],
            "categorical": ["channel", "language"],
            "drop_columns": ["interaction_id", "timestamp"],
            "identifier_columns": ["interaction_id", "timestamp"],
        },
        "ensemble": {
            "weights": {"iforest": 0.5, "lof": 0.5}
        }
    }
    
    # Patch model state
    from src import service
    service._model_state["preprocessor"] = mock_preprocessor
    service._model_state["models"] = {
        "iforest": mock_iforest,
        "lof": mock_lof,
    }
    service._model_state["metadata"] = {
        "iforest": mock_iforest_metadata,
        "lof": mock_lof_metadata,
    }
    service._model_state["config"] = mock_config
    
    yield
    
    # Cleanup
    service._model_state["preprocessor"] = None
    service._model_state["models"] = {}
    service._model_state["metadata"] = {}
    service._model_state["config"] = None


@pytest.fixture
def client():
    """Create test client."""
    from src.service import app
    return TestClient(app)


def test_health_endpoint(client, mock_model_state):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data


def test_score_endpoint_both_models(client, mock_model_state):
    """Test scoring endpoint with both models (default)."""
    payload = [
        {
            "interaction_id": "test-123",
            "timestamp": "2025-01-01T10:00:00Z",
            "csat": 4.5,
            "ies": 80.0,
            "complaints": 0,
            "aht_seconds": 300,
            "hold_time_seconds": 30,
            "transfers": 0,
            "channel": "voice",
            "language": "en",
            "queue": "billing",
        }
    ]
    
    response = client.post("/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "scores" in data
    assert "total_records" in data
    assert data["total_records"] == 1
    assert len(data["scores"]) == 1
    
    score = data["scores"][0]
    assert "interaction_id" in score
    assert score["interaction_id"] == "test-123"
    assert "scores" in score
    assert "is_anomaly" in score
    # Both models should be present
    assert "iforest" in score["scores"]
    assert "rcf" in score["scores"]
    assert "iforest" in score["is_anomaly"]
    assert "rcf" in score["is_anomaly"]
    assert "ensemble" in score["is_anomaly"]


def test_score_endpoint_iforest_only(client, mock_model_state):
    """Test scoring endpoint with iforest only."""
    payload = [
        {
            "interaction_id": "test-456",
            "timestamp": "2025-01-01T10:00:00Z",
            "csat": 4.5,
            "ies": 80.0,
            "complaints": 0,
            "aht_seconds": 300,
            "hold_time_seconds": 30,
            "transfers": 0,
            "channel": "voice",
            "language": "en",
            "queue": "billing",
        }
    ]
    
    response = client.post("/score?model=iforest", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    score = data["scores"][0]
    assert "iforest" in score["scores"]
    assert "rcf" not in score["scores"]
    assert "iforest" in score["is_anomaly"]
    assert "rcf" not in score["is_anomaly"]
    assert "ensemble" not in score["is_anomaly"]


def test_score_endpoint_rcf_only(client, mock_model_state):
    """Test scoring endpoint with rcf only."""
    payload = [
        {
            "interaction_id": "test-789",
            "timestamp": "2025-01-01T10:00:00Z",
            "csat": 4.5,
            "ies": 80.0,
            "complaints": 0,
            "aht_seconds": 300,
            "hold_time_seconds": 30,
            "transfers": 0,
            "channel": "voice",
            "language": "en",
            "queue": "billing",
        }
    ]
    
    response = client.post("/score?model=rcf", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    score = data["scores"][0]
    assert "rcf" in score["scores"]
    assert "iforest" not in score["scores"]
    assert "rcf" in score["is_anomaly"]
    assert "iforest" not in score["is_anomaly"]
    assert "ensemble" not in score["is_anomaly"]


def test_score_endpoint_invalid_model(client, mock_model_state):
    """Test scoring endpoint with invalid model parameter."""
    payload = [
        {
            "interaction_id": "test-999",
            "timestamp": "2025-01-01T10:00:00Z",
            "csat": 4.5,
            "ies": 80.0,
            "complaints": 0,
            "aht_seconds": 300,
            "hold_time_seconds": 30,
            "transfers": 0,
            "channel": "voice",
            "language": "en",
            "queue": "billing",
        }
    ]
    
    response = client.post("/score?model=invalid_model", json=payload)
    assert response.status_code == 400
    assert "model must be one of" in response.json()["detail"]


def test_score_endpoint_multiple_records(client, mock_model_state):
    """Test scoring with multiple records."""
    from unittest.mock import MagicMock
    import numpy as np
    
    # Update mock to handle multiple records
    from src import service
    service._model_state["preprocessor"].transform.return_value = np.array([
        [1.0, 2.0, 3.0],
        [1.5, 2.5, 3.5],
    ])
    service._model_state["models"]["iforest"].score_samples.return_value = np.array([-0.5, -0.3])
    service._model_state["models"]["lof"].detector_.score_samples.return_value = np.array([-0.6, -0.4])
    
    payload = [
        {
            "interaction_id": f"test-{i}",
            "timestamp": "2025-01-01T10:00:00Z",
            "csat": 4.0 + i * 0.1,
            "ies": 75.0 + i * 5,
            "complaints": 0,
            "aht_seconds": 300,
            "hold_time_seconds": 30,
            "transfers": 0,
            "channel": "voice",
            "language": "en",
            "queue": "billing",
        }
        for i in range(2)
    ]
    
    response = client.post("/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_records"] == 2
    assert len(data["scores"]) == 2


def test_score_endpoint_invalid_data(client, mock_model_state):
    """Test scoring with invalid data."""
    payload = [
        {
            "interaction_id": "test-123",
            "timestamp": "invalid-timestamp",
            "csat": 10.0,  # Out of range
        }
    ]
    
    response = client.post("/score", json=payload)
    assert response.status_code == 422  # Validation error
