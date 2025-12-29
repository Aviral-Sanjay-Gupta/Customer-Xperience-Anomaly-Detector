# CX Anomaly Detector - Makefile
# Automation targets for development workflow

.PHONY: help setup install train evaluate serve batch test clean docker-build docker-up docker-down
.PHONY: train-iforest train-rcf train-all evaluate-all batch-iforest batch-rcf batch-ensemble

# Default target
help:
	@echo "CX Anomaly Detector - Available Commands:"
	@echo ""
	@echo "  make setup         - Create virtual environment and install dependencies"
	@echo "  make install       - Install dependencies only"
	@echo "  make train         - Train all anomaly detection models"
	@echo "  make train-all     - Train all models (alias for train)"
	@echo "  make evaluate      - Evaluate and compare all models"
	@echo "  make evaluate-all  - Evaluate all models (alias for evaluate)"
	@echo "  make serve         - Start the FastAPI service"
	@echo "  make batch         - Run batch scoring with ensemble (default)"
	@echo "  make batch-iforest - Run batch scoring with Isolation Forest only"
	@echo "  make batch-rcf     - Run batch scoring with RRCF only"
	@echo "  make batch-ensemble - Run batch scoring with ensemble (alias)"
	@echo "  make test          - Run unit tests"
	@echo "  make scheduler     - Start the batch scoring scheduler"
	@echo "  make clean         - Clean generated files and artifacts"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-up     - Start services with Docker Compose"
	@echo "  make docker-down   - Stop Docker Compose services"
	@echo ""

# Setup virtual environment and install dependencies
setup:
	@echo "Creating virtual environment..."
	python -m venv .venv
	@echo "Activating virtual environment and installing dependencies..."
	@echo "Please run: .venv\Scripts\activate (Windows) or source .venv/bin/activate (Unix)"
	@echo "Then run: make install"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pip install --upgrade pip
	pip install -r requirements.txt
	@echo "Dependencies installed successfully!"

# Train all models
train:
	@echo "Training all anomaly detection models..."
	python -m src.train

# Alias for train-all
train-all: train

# Evaluate all models with comparison
evaluate:
	@echo "Evaluating all models with comparison..."
	python -m src.evaluate

# Alias for evaluate-all
evaluate-all: evaluate

# Start API service
serve:
	@echo "Starting FastAPI service on http://localhost:8000"
	uvicorn src.service:app --host 0.0.0.0 --port 8000 --reload

# Run batch scoring with ensemble (default)
batch:
	@echo "Running batch scoring with ensemble..."
	python -m src.predict --model ensemble

# Run batch scoring with Isolation Forest only
batch-iforest:
	@echo "Running batch scoring with Isolation Forest..."
	python -m src.predict --model iforest

# Run batch scoring with RRCF only
batch-rcf:
	@echo "Running batch scoring with RRCF..."
	python -m src.predict --model rcf

# Alias for batch-ensemble
batch-ensemble: batch

# Start scheduler
scheduler:
	@echo "Starting batch scoring scheduler..."
	python -m src.scheduler

# Run tests
test:
	@echo "Running unit tests..."
	pytest -v tests/

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	pytest --cov=src --cov-report=html --cov-report=term tests/
	@echo "Coverage report generated in htmlcov/index.html"

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	rm -rf models/artifacts/*.joblib
	rm -rf data/processed/*.csv
	rm -rf data/processed/*.png
	rm -rf htmlcov .coverage .pytest_cache
	rm -rf src/__pycache__ tests/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	@echo "Clean complete!"

# Build Docker images
docker-build:
	@echo "Building Docker images..."
	cd docker && docker compose build

# Start Docker services
docker-up:
	@echo "Starting Docker services..."
	cd docker && docker compose up -d
	@echo "Services started!"
	@echo "API: http://localhost:8000"
	@echo "MinIO Console: http://localhost:9001"

# Stop Docker services
docker-down:
	@echo "Stopping Docker services..."
	cd docker && docker compose down
	@echo "Services stopped!"

# Lint code
lint:
	@echo "Linting code with ruff..."
	ruff check src/ tests/

# Format code
format:
	@echo "Formatting code with black..."
	black src/ tests/

# Full workflow: train all -> evaluate all -> batch ensemble
workflow:
	@echo "Running full multi-model workflow..."
	$(MAKE) train
	$(MAKE) evaluate
	$(MAKE) batch
	@echo "Workflow complete!"
