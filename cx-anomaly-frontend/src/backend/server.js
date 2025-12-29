import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/score', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    filename: req.file.originalname,
    interaction_id,
    customer_id,
    anomaly_score: Math.random(),
    is_anomaly: Math.random() > 0.5,
    details: {
      feature_contributions: {
        duration: features.duration || 0,
        sentiment: features.sentiment || 0,
        channel: features.channel || 0
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});