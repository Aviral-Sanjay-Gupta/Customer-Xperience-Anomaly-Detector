# API Testing - cURL Examples

Ready-to-run `curl` commands for testing the CX Anomaly Detector API.

## Base Configuration

- **Base URL**: `http://localhost:8000`
- **Endpoint**: `POST /score?model=<name>`
- **Model options**: `iforest`, `rcf`, `both` (default)

---

## Isolation Forest (IForest)

### Positive Case - Anomaly Detected

```powershell
curl -X POST "http://localhost:8000/score?model=iforest" -H "Content-Type: application/json" -d '[{"interaction_id":"anomaly_if_1","timestamp":"2025-11-18T10:00:00Z","csat":1,"ies":20,"complaints":5,"aht_seconds":3600,"hold_time_seconds":1800,"transfers":8,"channel":"voice","language":"en","queue":"billing"}]'
```

**Expected Response:**
```json
{
  "scores": [
    {
      "interaction_id": "anomaly_if_1",
      "scores": {"iforest": 0.85},
      "is_anomaly": {"iforest": 1}
    }
  ],
  "total_records": 1,
  "anomalies_detected": 1,
  "processing_time_ms": 42.3
}
```

### Negative Case - Normal Interaction

```powershell
curl -X POST "http://localhost:8000/score?model=iforest" -H "Content-Type: application/json" -d '[{"interaction_id":"normal_if_1","timestamp":"2025-11-18T10:00:00Z","csat":85,"ies":92,"complaints":0,"aht_seconds":180,"hold_time_seconds":15,"transfers":0,"channel":"chat","language":"en","queue":"tech_support"}]'
```

**Expected Response:**
```json
{
  "scores": [
    {
      "interaction_id": "normal_if_1",
      "scores": {"iforest": 0.25},
      "is_anomaly": {"iforest": 0}
    }
  ],
  "total_records": 1,
  "anomalies_detected": 0,
  "processing_time_ms": 38.7
}
```

---

## Random Cut Forest (RCF) / LOF

### Positive Case - Anomaly Detected

```powershell
curl -X POST "http://localhost:8000/score?model=rcf" -H "Content-Type: application/json" -d '[{"interaction_id":"anomaly_rcf_1","timestamp":"2025-11-18T10:00:00Z","csat":5,"ies":15,"complaints":4,"aht_seconds":2800,"hold_time_seconds":1200,"transfers":6,"channel":"email","language":"hi","queue":"billing"}]'
```

**Expected Response:**
```json
{
  "scores": [
    {
      "interaction_id": "anomaly_rcf_1",
      "scores": {"rcf": 1.42},
      "is_anomaly": {"rcf": 1}
    }
  ],
  "total_records": 1,
  "anomalies_detected": 1,
  "processing_time_ms": 45.1
}
```

### Negative Case - Normal Interaction

```powershell
curl -X POST "http://localhost:8000/score?model=rcf" -H "Content-Type: application/json" -d '[{"interaction_id":"normal_rcf_1","timestamp":"2025-11-18T10:00:00Z","csat":88,"ies":90,"complaints":0,"aht_seconds":200,"hold_time_seconds":20,"transfers":0,"channel":"voice","language":"en","queue":"tech_support"}]'
```

**Expected Response:**
```json
{
  "scores": [
    {
      "interaction_id": "normal_rcf_1",
      "scores": {"rcf": 0.32},
      "is_anomaly": {"rcf": 0}
    }
  ],
  "total_records": 1,
  "anomalies_detected": 0,
  "processing_time_ms": 41.5
}
```

---

## Ensemble (Both Models)

### Default - No Model Parameter

```powershell
curl -X POST "http://localhost:8000/score" -H "Content-Type: application/json" -d '[{"interaction_id":"test_ensemble_1","timestamp":"2025-11-18T10:00:00Z","csat":2,"ies":35,"complaints":3,"aht_seconds":1500,"hold_time_seconds":800,"transfers":4,"channel":"voice","language":"en","queue":"billing"}]'
```

### Explicit Both Parameter

```powershell
curl -X POST "http://localhost:8000/score?model=both" -H "Content-Type: application/json" -d '[{"interaction_id":"test_ensemble_2","timestamp":"2025-11-18T10:00:00Z","csat":2,"ies":35,"complaints":3,"aht_seconds":1500,"hold_time_seconds":800,"transfers":4,"channel":"voice","language":"en","queue":"billing"}]'
```

**Expected Response:**
```json
{
  "scores": [
    {
      "interaction_id": "test_ensemble_1",
      "scores": {"iforest": 0.78, "lof": 1.23, "ensemble": 0.815},
      "is_anomaly": {"iforest": 1, "lof": 1, "ensemble": 1}
    }
  ],
  "total_records": 1,
  "anomalies_detected": 1,
  "processing_time_ms": 52.8
}
```

**Note**: 
- The `ensemble` score is a weighted average of normalized individual model scores
- The `ensemble` flag is `1` (anomaly) if **either** model detects an anomaly (logical OR)

---

## Batch Scoring - Multiple Records

```powershell
curl -X POST "http://localhost:8000/score?model=both" -H "Content-Type: application/json" -d '[{"interaction_id":"batch_1","timestamp":"2025-11-18T09:00:00Z","csat":4.5,"ies":88,"complaints":0,"aht_seconds":180,"hold_time_seconds":10,"transfers":0,"channel":"chat","language":"en","queue":"sales"},{"interaction_id":"batch_2","timestamp":"2025-11-18T09:15:00Z","csat":1.2,"ies":25,"complaints":4,"aht_seconds":2200,"hold_time_seconds":900,"transfers":7,"channel":"voice","language":"es","queue":"billing"},{"interaction_id":"batch_3","timestamp":"2025-11-18T09:30:00Z","csat":3.8,"ies":75,"complaints":1,"aht_seconds":420,"hold_time_seconds":60,"transfers":1,"channel":"email","language":"en","queue":"tech_support"}]'
```

**Expected Response:**
```json
{
  "scores": [
    {
      "interaction_id": "batch_1",
      "scores": {"iforest": 0.22, "rcf": 0.28, "ensemble": 0.25},
      "is_anomaly": {"iforest": 0, "rcf": 0, "ensemble": 0}
    },
    {
      "interaction_id": "batch_2",
      "scores": {"iforest": 0.91, "rcf": 1.58, "ensemble": 0.92},
      "is_anomaly": {"iforest": 1, "rcf": 1, "ensemble": 1}
    },
    {
      "interaction_id": "batch_3",
      "scores": {"iforest": 0.45, "rcf": 0.52, "ensemble": 0.48},
      "is_anomaly": {"iforest": 0, "rcf": 0, "ensemble": 0}
    }
  ],
  "total_records": 3,
  "anomalies_detected": 1,
  "processing_time_ms": 67.4
}
```

---

## Error Cases

### Invalid Model Parameter

```powershell
curl -X POST "http://localhost:8000/score?model=invalid" -H "Content-Type: application/json" -d '[{"interaction_id":"error_1","timestamp":"2025-11-18T10:00:00Z","csat":3,"ies":65,"complaints":0,"aht_seconds":300,"hold_time_seconds":30,"transfers":0,"channel":"voice","language":"en","queue":"billing"}]'
```

**Expected Response:**
```json
{
  "detail": "model must be one of: iforest, rcf, both"
}
```
**Status Code**: 400

### Missing Required Fields

```powershell
curl -X POST "http://localhost:8000/score" -H "Content-Type: application/json" -d '[{"interaction_id":"error_2","timestamp":"2025-11-18T10:00:00Z"}]'
```

**Status Code**: 200 (fields are optional, uses imputation)

---

## Health Check & Model Info

### Health Check

```powershell
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T14:23:45.123Z",
  "model_loaded": true,
  "version": "0.1.0"
}
```

### List Available Models

```powershell
curl http://localhost:8000/models
```

**Response:**
```json
{
  "models": {
    "iforest": {
      "algorithm": "IsolationForest",
      "threshold": 0.4523,
      "train_timestamp": "2025-11-17T13:24:50Z",
      "n_samples": 500,
      "n_features": 8
    },
    "lof": {
      "algorithm": "LOF",
      "threshold": 0.6214,
      "train_timestamp": "2025-11-17T13:24:50Z",
      "n_samples": 500,
      "n_features": 8
    }
  },
  "ensemble_available": true,
  "loaded_at": "2025-11-18T14:20:12.456Z"
}
```

---

## Notes

- All scores follow **higher = more anomalous** convention
- `is_anomaly` values are integers: `0` (normal) or `1` (anomaly)
- Timestamps must be ISO-8601 format
- CSAT range: 1.0 - 5.0 (lower is worse)
- IES range: 0.0 - 100.0 (lower is worse)
- Model parameter is case-insensitive
- RCF is internally implemented as LOF (Local Outlier Factor)
