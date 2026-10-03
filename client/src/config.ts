import axios from "axios";

// Public ngrok backend URL
const defaultUrl = "https://domestic-science-jawed.ngrok-free.dev";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  (typeof window !== "undefined" && window.location.origin.includes("ngrok")
    ? window.location.origin
    : defaultUrl);

// Pre-configured Axios instance for ngrok API calls
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  timeout: 8000,
});
