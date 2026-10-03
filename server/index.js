const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

let telemetryHistory = [];

// Root Route
app.get("/", (req, res) => {
  res.send("🚀 Astra Backend Running Successfully");
});

// Dedicated API health endpoint
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

// Serve frontend production build statically if available
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(path.join(clientDistPath, "index.html"))) {
  app.use(express.static(clientDistPath));
  // Single Page Application (SPA) catch-all for React Router navigation
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});