import axios from "axios";

// Deployed Render backend base URL
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string) ||
  "https://astra-backend-9k29.onrender.com";

// Configured Axios instance using deployed backend URL
export const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export const API_BASE_URL = API_URL;
export const apiClient = API;
export default API;
