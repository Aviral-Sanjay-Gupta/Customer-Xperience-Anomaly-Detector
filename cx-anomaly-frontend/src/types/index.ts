// Core Domain Types
export type ModelName = 'iforest' | 'lof' | 'both';

export interface InteractionRecord {
  interaction_id: string;
  timestamp: string;
  csat: number;
  ies: number;
  complaints: number;
  aht_seconds: number;
  hold_time_seconds: number;
  transfers: number;
  channel: string;
  language: string;
  queue: string;
}

export interface ScoreResult extends InteractionRecord {
  scores?: {
    iforest?: number;
    lof?: number;
    ensemble?: number;
  };
  is_anomaly?: {
    iforest?: number;
    lof?: number;
    ensemble?: number;
  };
  // Legacy support for old API format
  ensemble_score?: number;
  ensemble_anomaly?: boolean;
  iforest_score?: number;
  iforest_anomaly?: boolean;
  lof_score?: number;
  lof_anomaly?: boolean;
  anomaly_score?: number;
  isSingleRecord?: boolean;
  singleRecordNumber?: number;
}

export interface ModelMetadata {
  name: string;
  algorithm: string;
  threshold: number;
  train_timestamp?: string;
  n_samples?: number;
  n_features?: number;
}

export interface ModelsResponse {
  models: {
    iforest?: ModelMetadata;
    lof?: ModelMetadata;
  } | ModelMetadata[];
  ensemble_available?: boolean;
  loaded_at?: string;
}

export interface ScoreResponse {
  scores: ScoreResult[];
  total_records?: number;
  anomalies_detected?: number;
  processing_time_ms?: number;
}

export interface StatsData {
  totalInteractions: number;
  totalFlags: number;
  fileName: string;
  totalFeatures: number;
  thresholds: {
    iforest: number;
    lof: number;
  };
}

// Form Types
export interface SingleRecordForm {
  interaction_id: string;
  timestamp: string;
  csat: string;
  ies: string;
  complaints: string;
  aht_seconds: string;
  hold_time_seconds: string;
  transfers: string;
  channel: string;
  language: string;
  queue: string;
}

export type InputMode = 'dataset' | 'single';
