import axios, { AxiosResponse } from "axios";
import type { InteractionRecord, ScoreResponse, ModelName, ModelsResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const scoreInteractions = async (
  records: InteractionRecord[],
  model: ModelName = "both"
): Promise<AxiosResponse<ScoreResponse>> => {
  return axios.post<ScoreResponse>(`${API_BASE}/score?model=${model}`, records, {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const getModels = async (): Promise<AxiosResponse<ModelsResponse>> => {
  return axios.get<ModelsResponse>(`${API_BASE}/models`);
};
