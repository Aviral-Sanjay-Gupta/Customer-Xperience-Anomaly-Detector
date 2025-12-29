# CX Anomaly Detector Widget

An end-to-end anomaly detection system for Customer Experience (CX) metrics. This project combines a robust Python-based Machine Learning backend with a modern, interactive React frontend to identify and visualize unusual patterns in customer interactions.

## 🚀 Overview

The **CX Anomaly Detector** monitors key metrics such as CSAT (Customer Satisfaction), AHT (Average Handle Time), and Transfer Rates. It uses a **multi-model ensemble** approach (Isolation Forest + Robust Random Cut Forest) to flag anomalies in real-time, helping support teams proactively address service quality issues.

### Key Features

*   **Real-time Anomaly Scoring**: Instant detection of outliers in CX data.
*   **Multi-Model Ensemble**: Combines multiple algorithms for higher accuracy and fewer false positives.
*   **Interactive Dashboard**: comprehensive visualizations of anomaly scores, feature importance, and metric trends.
*   **Batch Processing**: Automated scoring of large datasets.
*   **Production Ready**: Dockerized services, comprehensive logging, and configuration-driven architecture.

## 🏗️ Architecture Setup

This repository is a monorepo containing:

1.  **`Backend/`**: The Core ML engine and REST API.
    *   **Tech**: Python 3.10+, FastAPI, PyOD (Isolation Forest, RRCF), Pandas, Scikit-Learn.
    *   **Role**: Trains models, serves predictions via API, handles batch processing.

2.  **`cx-anomaly-frontend/`**: The User Interface.
    *   **Tech**: React, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts/Chart.js.
    *   **Role**: Consumes the Backend API to display alerts, detailed score breakdowns, and historical trends.

## 🛠️ Quick Start Guide

### Prerequisites

*   **Node.js** (v18+ recommended) & **npm**
*   **Python** (3.10+) & **pip**
*   (Optional) **Docker** for containerized deployment

### 1. Backend Setup

Initialize the ML service first.

```powershell
# Navigate to the backend directory
cd Backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env

# Train the initial models (Required before running the API)
python -m src.train

# Start the API server
python -m src.service
# The API will be available at http://localhost:8000
```

### 2. Frontend Setup

Launch the dashboard to visualize the data.

```powershell
# Open a new terminal and navigate to the frontend directory
cd cx-anomaly-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
# The Dashboard will be available at http://localhost:5173
```

## 📂 Project Structure

```text
CX-AD Widget/
├── Backend/                 # Python/FastAPI Backend
│   ├── src/                 # Source code for training, inference, and API
│   ├── data/                # Data storage (input/processed)
│   ├── models/              # Saved model artifacts
│   └── tests/               # Python test suite
│
├── cx-anomaly-frontend/     # React/Vite Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application views (Dashboard, Home)
│   │   ├── hooks/           # Custom React hooks
│   │   └── services/        # API integration
│   └── public/              # Static assets
│
└── README.md                # Project documentation
```

## 🧪 Usage

1.  **Training**: Run `python -m src.train` in the `Backend` folder to update models with new data.
2.  **Scoring**: The API (`POST /score`) accepts JSON payloads of interaction data.
3.  **Visualization**: Use the Frontend dashboard to view real-time streams of scored transactions and investigate flagged anomalies.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
