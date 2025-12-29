# CX Anomaly Detector

> Production-ready, unsupervised anomaly detection system for customer experience (CX) metrics using **multi-model ensemble** (Isolation Forest + RRCF).

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

The CX Anomaly Detector identifies unusual patterns in customer interaction data to proactively flag potential service issues. It uses a **multi-model approach** combining **Isolation Forest** and **Robust Random Cut Forest (RRCF)** algorithms to provide robust anomaly detection across multiple CX metrics including CSAT scores, handle times, transfer rates, and more.

### Key Features

- **Multi-Model Architecture**: Combines Isolation Forest and RRCF for robust detection
- **Ensemble Scoring**: Configurable ensemble strategies (average, max, voting)
- **Model Selection**: Choose specific models or ensemble at inference time
- **Real-time Scoring**: FastAPI REST API for low-latency anomaly detection
- **Batch Processing**: Scheduled scoring of large datasets with automated alerting
- **Production Ready**: Configuration-driven, artifact registry, comprehensive logging
- **Cloud Ready**: Docker support with MinIO (S3-compatible storage)
- **Extensible**: Modular design for easy integration with existing systems

## Quick Start

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- (Optional) Docker and Docker Compose for containerized deployment

### Installation

1. **Clone the repository**
   ```powershell
   git clone <repository-url>
   cd CX-AD Widget\Backend
   ```

2. **Set up virtual environment**
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```powershell
   # Copy and edit environment file
   copy .env.example .env
   # Edit .env with your settings
   ```

### Training the Models

Train both Isolation Forest and RRCF models on your training data:

```powershell
python -m src.train
# Or use make:
make train
```

**What happens:**
- Loads training data from `data/input/mock_train.csv`
- Preprocesses features (imputation, scaling, one-hot encoding)
- Trains **both** Isolation Forest and RRCF models
- Saves artifacts to `models/artifacts/`:
  - `preprocessor.joblib` (shared)
  - `model_iforest.joblib`, `meta_iforest.joblib`
  - `model_rcf.joblib`, `meta_rcf.joblib`
  - `meta_global.joblib`

**Output:**
```
Training completed successfully!
Trained on 500 samples
Generated 8 features
Models trained: iforest, rcf
  iforest - Threshold: 0.4523
  rcf - Threshold: 0.6214
```

### Evaluating the Models

Analyze and compare model performance:

```powershell
python -m src.evaluate
# Or use make:
make evaluate
```

Generates:
- Side-by-side score distribution histograms for both models
- Anomaly classification box plots for comparison
- Score correlation analysis
- Summary statistics per model
- Plot saved to `data/processed/score_distribution.png`

### Running the API Service

Start the FastAPI server for real-time scoring:

```powershell
python -m src.service
# Or using uvicorn directly:
uvicorn src.service:app --host 0.0.0.0 --port 8000
# Or use make:
make serve
```

**Test the API:**

1. **Health Check**
   ```powershell
   curl http://localhost:8000/health
   ```

2. **List Available Models**
   ```powershell
   curl http://localhost:8000/models
   ```
   
   Response:
   ```json
   {
     "models": {
       "iforest": {
         "algorithm": "IsolationForest",
         "threshold": 0.4523,
         "train_timestamp": "2025-01-15T10:00:00Z",
         "n_samples": 500,
         "n_features": 8
       },
       "rcf": {
         "algorithm": "RRCF",
         "threshold": 0.6214,
         "train_timestamp": "2025-01-15T10:00:00Z",
         "n_samples": 500,
         "n_features": 8
       }
     },
     "ensemble_available": true,
     "loaded_at": "2025-01-15T10:15:00Z"
   }
   ```

3. **Score Interactions (Ensemble - Default)**
   ```powershell
   curl -X POST "http://localhost:8000/score" `
     -H "Content-Type: application/json" `
     -d '[{
       "interaction_id": "test-123",
       "timestamp": "2025-01-15T10:00:00Z",
       "csat": 2.1,
       "ies": 45.0,
       "complaints": 2,
       "aht_seconds": 650,
       "hold_time_seconds": 180,
       "transfers": 3,
       "channel": "voice",
       "language": "en",
       "queue": "billing"
     }]'
   ```
   
   Response (model=both or no model param):
   ```json
   {
     "scores": [
       {
         "interaction_id": "test-123",
         "scores": {"iforest": 0.83, "rcf": 1.12},
         "is_anomaly": {"iforest": 1, "rcf": 1, "ensemble": 1}
       }
     ],
     "total_records": 1,
     "anomalies_detected": 1,
     "processing_time_ms": 45.2
   }
   ```

4. **Score with Specific Model**
   
   **Isolation Forest only:**
   ```powershell
   curl -X POST "http://localhost:8000/score?model=iforest" `
     -H "Content-Type: application/json" `
     -d '[{
       "interaction_id": "test-456",
       "timestamp": "2025-01-15T10:00:00Z",
       "csat": 4.2,
       "ies": 85.0,
       "complaints": 0,
       "aht_seconds": 200,
       "hold_time_seconds": 20,
       "transfers": 0,
       "channel": "chat",
       "language": "en",
       "queue": "tech_support"
     }]'
   ```
   
   Response (model=iforest):
   ```json
   {
     "scores": [
       {
         "interaction_id": "test-456",
         "scores": {"iforest": 0.25},
         "is_anomaly": {"iforest": 0}
       }
     ],
     "total_records": 1,
     "anomalies_detected": 0,
     "processing_time_ms": 38.1
   }
   ```
   
   **RCF only:**
   ```powershell
   curl -X POST "http://localhost:8000/score?model=rcf" `
     -H "Content-Type: application/json" `
     -d '[{
       "interaction_id": "test-789",
       "timestamp": "2025-01-15T10:00:00Z",
       "csat": 1.5,
       "ies": 20.0,
       "complaints": 3,
       "aht_seconds": 1200,
       "hold_time_seconds": 600,
       "transfers": 5,
       "channel": "voice",
       "language": "en",
       "queue": "billing"
     }]'
   ```
   
   Response (model=rcf):
   ```json
   {
     "scores": [
       {
         "interaction_id": "test-789",
         "scores": {"rcf": 1.45},
         "is_anomaly": {"rcf": 1}
       }
     ],
     "total_records": 1,
     "anomalies_detected": 1,
     "processing_time_ms": 42.7
   }
   ```

5. **View API Documentation**
   Navigate to http://localhost:8000/docs for interactive Swagger UI

### Batch Scoring

Process inference data in batch mode with model selection:

```powershell
# Ensemble scoring (default)
python -m src.predict --model ensemble
make batch

# Isolation Forest only
python -m src.predict --model iforest
make batch-iforest

# RRCF only
python -m src.predict --model rcf
make batch-rcf
```

**Output:**
- Scores all records in `data/input/mock_inference.csv`
- Saves results to `data/processed/anomalies_<model>_<timestamp>.csv`
- Output includes scores from all models plus ensemble (if selected)

## Project Structure

```
cx-anomaly-detector/
├── configs/
│   └── config.local.yaml          # Configuration file
├── data/
│   ├── input/                     # Training and inference data
│   │   ├── mock_train.csv
│   │   └── mock_inference.csv
│   └── processed/                 # Output files
├── docker/
│   ├── Dockerfile.api             # API service Docker image
│   └── docker-compose.yml         # Multi-service orchestration
├── models/
│   └── artifacts/                 # Trained model artifacts
│       ├── preprocessor.joblib    # Shared feature preprocessor
│       ├── model_iforest.joblib   # Isolation Forest model
│       ├── meta_iforest.joblib    # IForest metadata
│       ├── model_rcf.joblib       # RRCF model
│       ├── meta_rcf.joblib        # RRCF metadata
│       └── meta_global.joblib     # Global training metadata
├── src/
│   ├── __init__.py
│   ├── schema.py                  # Pydantic data models
│   ├── io_utils.py                # Data I/O utilities
│   ├── features.py                # Feature engineering
│   ├── telemetry.py               # Logging and metrics
│   ├── train.py                   # Training pipeline
│   ├── evaluate.py                # Evaluation pipeline
│   ├── predict.py                 # Batch prediction
│   ├── service.py                 # FastAPI service
│   ├── alerts.py                  # Alerting (Slack/Email)
│   └── scheduler.py               # Job scheduling
├── tests/
│   ├── test_features.py
│   ├── test_train.py
│   └── test_service.py
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── Makefile                       # Automation commands
├── pyproject.toml                 # Project metadata
├── requirements.txt               # Dependencies
├── README.md                      # This file
└── steps.md                       # Setup instructions
```

## Configuration

Edit `configs/config.local.yaml` to customize:

- **Features**: Which columns to use as numeric/categorical features
- **Preprocessing**: Imputation strategy, scaling method
- **Models**: Configure multiple models (Isolation Forest, RRCF)
- **Ensemble**: Ensemble strategy and model weights
- **Paths**: Data locations, artifact storage
- **Thresholds**: Anomaly detection threshold percentile per model

Example multi-model configuration:

```yaml
features:
  numeric:
    - csat
    - ies
    - aht_seconds
  categorical:
    - channel
    - language

models:
  - name: "iforest"
    algorithm: "IsolationForest"
    params:
      n_estimators: 100
      contamination: 0.1
      random_state: 42
    threshold_percentile: 90
  
  - name: "rcf"
    algorithm: "RRCF"
    params:
      n_estimators: 100
      tree_size: 256
      contamination: 0.1
      random_state: 42
    threshold_percentile: 90

ensemble:
  strategy: "average"  # average, max, voting
  weights:
    iforest: 0.5
    rcf: 0.5
```

### Ensemble Strategies

- **average**: Weighted average of anomaly scores (configurable weights)
- **max**: Takes maximum score across all models (conservative)
- **voting**: Majority voting on anomaly/normal classification

## Docker Deployment

### Build and Run with Docker Compose

```powershell
cd docker
docker compose up --build
```

This starts:
- **API Service**: http://localhost:8000
- **MinIO**: http://localhost:9001 (Console)

### Access Services

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001 (admin/minioadmin)

### Stop Services

```powershell
cd docker
docker compose down
```

## Scheduling & Alerts

### Enable Automated Batch Scoring

1. **Configure scheduler** in `.env`:
   ```
   ENABLE_SCHEDULER=true
   BATCH_SCORE_CRON=0 */6 * * *
   ```

2. **Configure alerts**:
   ```
   ENABLE_ALERTS=true
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
   ```

3. **Start scheduler**:
   ```powershell
   python -m src.scheduler
   ```

The scheduler will run batch scoring every 6 hours and send alerts when anomalies are detected.

## Testing

Run the test suite:

```powershell
# Run all tests
pytest -v

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_features.py -v
```

## Makefile Commands

Use the Makefile for common tasks:

```powershell
make help             # Show all available commands
make setup            # Create virtual environment
make install          # Install dependencies
make train            # Train all models
make evaluate         # Evaluate and compare all models
make serve            # Start API service
make batch            # Run batch scoring with ensemble
make batch-iforest    # Run batch scoring with Isolation Forest
make batch-rcf        # Run batch scoring with RRCF
make test             # Run tests
make clean            # Clean generated files
make docker-up        # Start Docker services
make docker-down      # Stop Docker services
make workflow         # Run full train -> evaluate -> batch pipeline
```

## Data Schema

### Input Schema

All CSV files must contain these columns:

| Column | Type | Description | Range |
|--------|------|-------------|-------|
| `interaction_id` | string | Unique interaction ID | - |
| `timestamp` | datetime | Interaction timestamp | ISO 8601 |
| `csat` | float | Customer satisfaction score | 1.0 - 5.0 |
| `ies` | float | Internal efficiency score | 0.0 - 100.0 |
| `complaints` | int | Number of complaints | 0+ |
| `aht_seconds` | float | Average handle time (seconds) | 0+ |
| `hold_time_seconds` | float | Hold time (seconds) | 0+ |
| `transfers` | int | Number of transfers | 0+ |
| `channel` | string | Communication channel | voice, chat, email |
| `language` | string | Language code | en, es, fr, de, etc. |
| `queue` | string | Queue name | billing, support, sales |

### Output Schema

Batch scoring produces CSV files with:

**For ensemble mode:**
- All input columns (interaction_id, timestamp, features)
- `ensemble_score`: Combined anomaly score from all models
- `ensemble_anomaly`: Boolean flag for ensemble decision
- `ensemble_threshold`: Threshold used for ensemble
- `iforest_score`, `iforest_anomaly`, `iforest_threshold`: Isolation Forest results
- `rcf_score`, `rcf_anomaly`, `rcf_threshold`: RRCF results

**For single model mode (e.g., --model iforest):**
- All input columns
- `iforest_score`: Model-specific anomaly score
- `iforest_anomaly`: Boolean flag
- `iforest_threshold`: Threshold used

## API Reference

### Endpoints

**GET /health**
- Health check endpoint
- Returns service status and model availability

**GET /models**
- List all available models and their metadata
- Returns model info, thresholds, training timestamps

**POST /score?model={model_name}**
- Score one or more interactions for anomalies
- Query parameter: `model` (optional, default: "both")
  - **Valid values**: `"iforest"`, `"rcf"`, `"both"`
  - `"iforest"` - Returns only Isolation Forest scores and flags
  - `"rcf"` - Returns only RCF/LOF scores and flags
  - `"both"` - Returns both models plus ensemble flag (OR of individual flags)
- Request body: Array of `InteractionRecord` objects
- Returns: `BatchScoreResponse` with selective model results
  - When `model=iforest`: Response contains only `{"scores": {"iforest": X}, "is_anomaly": {"iforest": 0|1}}`
  - When `model=rcf`: Response contains only `{"scores": {"rcf": X}, "is_anomaly": {"rcf": 0|1}}`
  - When `model=both`: Response contains `{"scores": {"iforest": X, "rcf": Y}, "is_anomaly": {"iforest": 0|1, "rcf": 0|1, "ensemble": 0|1}}`
- Scores are **higher = more anomalous** convention
- Returns `400` error if model parameter is invalid

**POST /reload**
- Reload model artifacts without restarting service
- Useful for model updates

**GET /**
- Root endpoint with service information

**GET /docs**
- Interactive API documentation (Swagger UI)

## Performance Considerations

- **Training**: ~2-10 seconds for 500-1000 samples with both models
- **API Latency**: <100ms for single record, <500ms for 100 records
- **Batch Processing**: ~500-1000 records/second (depends on ensemble strategy)
- **Memory**: ~250MB baseline + model size (~20-80MB for both models)

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure virtual environment is activated and pyod is installed
   ```powershell
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Missing artifacts**: Train models before running evaluation/prediction
   ```powershell
   python -m src.train
   ```

3. **Model not found**: Verify model name matches config (iforest, rcf)
   ```powershell
   curl http://localhost:8000/models
   ```

4. **Port already in use**: Change port in `.env`
   ```
   API_PORT=8080
   ```

5. **Docker issues**: Check Docker daemon is running
   ```powershell
   docker ps
   ```

## Next Steps

### Integration

- **AWS**: Replace MinIO with S3, deploy on ECS/Lambda
- **Observability**: Add Prometheus metrics, Grafana dashboards
- **MLOps**: Integrate with SageMaker, MLflow, or similar
- **Streaming**: Connect to Kafka/Kinesis for real-time scoring

### Enhancements

- **Additional Models**: Add LOF, Autoencoders, or other PyOD models
- **Dynamic Ensembles**: Learn optimal ensemble weights from validation data
- **Feature Engineering**: Add rolling statistics, time-based features
- **Explainability**: Integrate SHAP values for interpretability
- **A/B Testing**: Framework for model comparison and champion/challenger

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or issues:
- Open an issue on GitHub
- Contact the team at [your-email]

## Acknowledgments

Built with:
- [scikit-learn](https://scikit-learn.org/) - Isolation Forest implementation
- [PyOD](https://pyod.readthedocs.io/) - RRCF and anomaly detection toolkit
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [Pydantic](https://docs.pydantic.dev/) - Data validation
- [Loguru](https://loguru.readthedocs.io/) - Logging
- [Pydantic](https://docs.pydantic.dev/) - Data validation
- [Loguru](https://loguru.readthedocs.io/) - Logging
