const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Enable CORS for all incoming client requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

let telemetryHistory = [];

// Serve frontend production build statically
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// GET / - Serves full website to browsers, or returns backend message for API clients
app.get("/", (req, res) => {
  const acceptHeader = req.headers.accept || "";
  if (acceptHeader.includes("text/html")) {
    return res.sendFile(path.join(clientDistPath, "index.html"));
  }
  res.send("🚀 Astra Backend Running Successfully");
});

// GET /api - Dedicated API health endpoint
app.get("/api", (req, res) => {
  res.send("🚀 Astra Backend Running Successfully");
});

// POST /telemetry
// Input: { temperature: number, pressure: number, vibration: number }
// Logic:
// - If temperature > 35 OR vibration > 5 -> status = "ANOMALY"
// - Else -> status = "NORMAL"
// Risk logic:
// - temperature > 40 OR vibration > 6 -> HIGH risk
// - temperature > 35 OR vibration > 5 -> MEDIUM risk
// - else -> LOW risk
app.post("/telemetry", (req, res) => {
  const { temperature = 25, pressure = 35, vibration = 1.5 } = req.body || {};

  const numTemp = Number(temperature);
  const numPress = Number(pressure);
  const numVib = Number(vibration);

  const isAnomaly = numTemp > 35 || numVib > 5;
  const status = isAnomaly ? "ANOMALY" : "NORMAL";
  const timestamp = new Date().toISOString();

  // Determine risk level & reason
  let risk = "LOW";
  let reason = "All flight parameters operating nominal";

  if (numTemp > 40 && numVib > 6) {
    risk = "HIGH";
    reason = "Critical thermal surge (>40°C) with severe mechanical vibration issue (>6 mm/s)";
  } else if (numTemp > 40) {
    risk = "HIGH";
    reason = "Critical thermal overload: temperature exceeds 40°C safety ceiling";
  } else if (numVib > 6) {
    risk = "HIGH";
    reason = "Mechanical issue: excessive vibration amplitude (>6 mm/s) threatening structural integrity";
  } else if (numTemp > 35 && numVib > 5) {
    risk = "MEDIUM";
    reason = "Elevated temperature (>35°C) and harmonic vibration (>5 mm/s) threshold breach";
  } else if (numTemp > 35) {
    risk = "MEDIUM";
    reason = "Thermal threshold exceeded: temperature is above 35°C";
  } else if (numVib > 5) {
    risk = "MEDIUM";
    reason = "Mechanical oscillation detected: vibration is above 5 mm/s";
  } else {
    risk = "LOW";
    reason = "All sensor parameters are operating within nominal flight boundaries";
  }

  const message = isAnomaly
    ? `Anomaly detected (${risk} RISK): ${reason}`
    : `All systems nominal (LOW RISK): ${reason}`;

  const record = {
    status,
    temperature: numTemp,
    pressure: numPress,
    vibration: numVib,
    timestamp,
    message,
    reason,
    risk,
  };

  telemetryHistory.unshift(record);
  if (telemetryHistory.length > 50) telemetryHistory.pop();

  console.log(`[TELEMETRY] ${timestamp} | Temp: ${numTemp}°C | Press: ${numPress}kPa | Vib: ${numVib}mm/s => Status: ${status} | Risk: ${risk}`);

  res.json({
    status,
    temperature: numTemp,
    pressure: numPress,
    vibration: numVib,
    timestamp,
    message,
    reason,
    risk,
    data: record,
  });
});

// GET /timeline - fetch historical telemetry records
app.get("/timeline", (req, res) => {
  res.json(telemetryHistory);
});

// GET /report - health check & anomaly summary
app.get("/report", (req, res) => {
  const anomalies = telemetryHistory.filter((d) => d.status === "ANOMALY");
  res.json({
    status: "ONLINE",
    total: telemetryHistory.length,
    anomalies: anomalies.length,
  });
});

// Single Page Application (SPA) catch-all for React Router navigation (e.g., /dashboard)
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Astra Fullstack (Frontend + Backend) running on http://localhost:${PORT}`);
});