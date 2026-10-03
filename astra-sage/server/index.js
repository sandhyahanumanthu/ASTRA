const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

app.use(cors());
const app = express();
app.use(bodyParser.json());

let telemetryData = [];

// 🔹 TELEMETRY ENDPOINT
app.post("/telemetry", async (req, res) => {
  const { temperature, pressure, vibration } = req.body;

  let status = "UNKNOWN";

  try {
    const response = await axios.post("http://localhost:6000/predict", {
      temperature,
      pressure,
      vibration,
    });

    status = response.data.anomaly === "YES" ? "ANOMALY" : "NORMAL";
  } catch (error) {
    console.log("⚠️ ML Service not running, using fallback");

    status =
      temperature > 35 || vibration > 3 || pressure < 30 || pressure > 40
        ? "ANOMALY"
        : "NORMAL";
  }

  const record = {
    timestamp: new Date(),
    temperature,
    pressure,
    vibration,
    status,
  };

  telemetryData.push(record);

  res.json({
    message: "Data received",
    data: record,
  });
});


// 🔹 TIMELINE ENDPOINT
app.get("/timeline", (req, res) => {
  res.json({
    total: telemetryData.length,
    timeline: telemetryData,
  });
});


// 🔹 REPORT ENDPOINT (basic intelligence layer)
app.get("/report", (req, res) => {
  const anomalies = telemetryData.filter(d => d.status === "ANOMALY");

  if (anomalies.length === 0) {
    return res.json({
      message: "No anomalies detected",
    });
  }

  // simple reasoning
  let causes = {
    temperature: 0,
    pressure: 0,
    vibration: 0,
  };

  anomalies.forEach(d => {
    if (d.temperature > 35) causes.temperature++;
    if (d.pressure < 30 || d.pressure > 40) causes.pressure++;
    if (d.vibration > 3) causes.vibration++;
  });

  res.json({
    total_records: telemetryData.length,
    anomalies: anomalies.length,
    suspected_root_cause: causes,
  });
});


// 🔹 SIMULATION ENDPOINT
app.post("/simulate", async (req, res) => {
  const { temperature, pressure, vibration } = req.body;

  try {
    const response = await axios.post("http://localhost:6000/predict", {
      temperature,
      pressure,
      vibration,
    });

    res.json({
      input: req.body,
      predicted: response.data.anomaly,
    });
  } catch (error) {
    res.json({
      error: "ML Service not running",
    });
  }
});


app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});