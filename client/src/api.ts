import axios from "axios";

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

export const API_BASE_URL = API_URL;
export const apiClient = API;
export default API;
