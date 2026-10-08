import axios from "axios";
import type {
  TelemetryRecord,
  HealthResponse,
  InvestigationCase,
  SimulationResult,
  TelemetrySummary,
  HumanFeedback,
} from "./types/telemetry";

// Deployed Render backend base URL
// Loaded from .env (VITE_API_URL) at build time by Vite
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  "https://astra-backend-87xd.onrender.com";

// Debug: always log which backend we are talking to
console.log("[Astra] API URL:", API_URL);

// Configured Axios instance
// Timeout is 50s to survive Render free-tier cold starts (~30-50s spin-up)
export const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 50000, // 50 seconds — handles Render cold-start delays
});

// Request interceptor: log every outgoing request
API.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} → ${config.baseURL}${config.url}`);
  return config;
});

// Response interceptor: log full error details
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[API Error] Status:", error?.response?.status);
    console.error("[API Error] Data:", error?.response?.data);
    console.error("[API Error] Message:", error?.message);
    console.error("[API Error] Code:", error?.code);
    return Promise.reject(error);
  }
);

// Typed API Helper Functions

export async function checkHealth(): Promise<HealthResponse> {
  const res = await API.get<HealthResponse>("/health");
  return res.data;
}

export async function getTelemetry(limit = 20, status?: string): Promise<TelemetryRecord[]> {
  const params: Record<string, any> = { limit };
  if (status) params.status = status;
  const res = await API.get<TelemetryRecord[]>("/telemetry", { params });
  return res.data;
}

export async function postTelemetry(payload: {
  temperature: number;
  pressure: number;
  vibration: number;
}): Promise<TelemetryRecord> {
  const res = await API.post<TelemetryRecord>("/telemetry", payload);
  return res.data;
}

export async function runSimulation(payload: {
  temperature: number;
  pressure: number;
  vibration: number;
}): Promise<SimulationResult> {
  const res = await API.post<SimulationResult>("/telemetry/simulate", payload);
  return res.data;
}

export async function getInvestigations(): Promise<InvestigationCase[]> {
  const res = await API.get<InvestigationCase[]>("/telemetry/investigations");
  return res.data;
}

export async function submitHumanFeedback(feedback: HumanFeedback): Promise<{ success: boolean; message: string }> {
  const res = await API.post<{ success: boolean; message: string }>("/telemetry/feedback", feedback);
  return res.data;
}

export async function getTelemetrySummary(): Promise<TelemetrySummary> {
  const res = await API.get<TelemetrySummary>("/telemetry/summary");
  return res.data;
}

export const API_BASE_URL = API_URL;
export const apiClient = API;
export default API;
