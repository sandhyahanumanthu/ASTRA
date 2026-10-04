const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Telemetry = require("../models/Telemetry");

// In-memory fallback cache when MongoDB is disconnected
let inMemoryHistory = [];

// Anomaly analysis engine
function analyzeTelemetry(numTemp, numPress, numVib) {
  const isAnomaly = numTemp > 35 || numVib > 5;
  const status = isAnomaly ? "ANOMALY" : "NORMAL";

  let riskLevel = "Low";
  let cause = "All flight parameters operating nominal";
  let explanation =
    "All thermal, barometric, and vibrational telemetry parameters are operating within safe baseline flight envelope.";

  if (numTemp > 40 && numVib > 6) {
    riskLevel = "High";
    cause = "Critical thermal overload (>40°C) with severe harmonic vibration (>6 mm/s)";
    explanation =
      "Severe compounded failure: avionics core temperature exceeds safety ceiling of 40°C while mechanical vibration amplitude exceeds 6 mm/s. Immediate risk of electronic degradation and structural fatigue.";
  } else if (numTemp > 40) {
    riskLevel = "High";
    cause = "Critical thermal overload: temperature exceeds 40°C safety ceiling";
    explanation =
      "Severe thermal surge: temperature has exceeded the 40°C emergency threshold. Heat dissipation failure suspected; active cooling or payload power down required.";
  } else if (numVib > 6) {
    riskLevel = "High";
    cause = "Excessive mechanical oscillation: vibration amplitude exceeds 6 mm/s";
    explanation =
      "Critical structural vibration: mechanical oscillation exceeds 6 mm/s threshold. Severe risk of harmonic resonance, fastener loosening, or sensor disorientation.";
  } else if (numTemp > 35 && numVib > 5) {
    riskLevel = "Medium";
    cause = "Dual boundary breach: elevated temperature (>35°C) and harmonic oscillation (>5 mm/s)";
    explanation =
      "Elevated thermal and vibrational stress detected. System operates above nominal threshold limits (Temp > 35°C, Vib > 5 mm/s).";
  } else if (numTemp > 35) {
    riskLevel = "Medium";
    cause = "Thermal threshold exceeded: temperature is above 35°C";
    explanation =
      "Thermal warning: core cell reading is above 35°C baseline. Thermal throttling recommended to prevent breaching the 40°C safety ceiling.";
  } else if (numVib > 5) {
    riskLevel = "Medium";
    cause = "Mechanical oscillation detected: vibration is above 5 mm/s";
    explanation =
      "Vibrational warning: mechanical oscillation amplitude is above 5 mm/s baseline. Recommend damping stabilizer activation.";
  } else {
    riskLevel = "Low";
    cause = "All parameters operating within safe flight envelope";
    explanation =
      "Nominal telemetry: thermal, pressure, and vibrational levels are strictly within safe operational boundaries.";
  }

  const message = isAnomaly
    ? `Anomaly detected (${riskLevel} Risk): ${cause}`
    : `All systems nominal (Low Risk): ${cause}`;

  return { status, riskLevel, cause, explanation, message };
}

// POST /telemetry — Process and save telemetry data
router.post("/", async (req, res) => {
  console.log("[TELEMETRY] POST received:");
  console.log(req.body);

  try {
    const { temperature = 25, pressure = 35, vibration = 1.5 } = req.body || {};

    const numTemp = Number(temperature);
    const numPress = Number(pressure);
    const numVib = Number(vibration);
    const timestamp = new Date();

    const { status, riskLevel, cause, explanation, message } = analyzeTelemetry(
      numTemp,
      numPress,
      numVib
    );

    const recordData = {
      temperature: numTemp,
      pressure: numPress,
      vibration: numVib,
      status,
      riskLevel,
      cause,
      explanation,
      message,
      timestamp,
    };

    // Save to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      const telemetry = new Telemetry(recordData);
      await telemetry.save();
      console.log("Data persisted");
      console.log("[TELEMETRY] Saved to MongoDB:", recordData);
    } else {
      console.warn("[TELEMETRY] MongoDB not connected — data not persisted to DB.");
    }

    // Always update in-memory fallback cache
    inMemoryHistory.unshift(recordData);
    if (inMemoryHistory.length > 50) inMemoryHistory.pop();

    console.log(
      `[TELEMETRY] ${timestamp.toISOString()} | Temp: ${numTemp}°C | Press: ${numPress}kPa | Vib: ${numVib}mm/s => Status: ${status} (${riskLevel} Risk)`
    );

    return res.status(200).json({
      status,
      riskLevel,
      cause,
      explanation,
      temperature: numTemp,
      pressure: numPress,
      vibration: numVib,
      timestamp: timestamp.toISOString(),
      message,
    });
  } catch (error) {
    console.error("[TELEMETRY] Error in POST /telemetry:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// GET /telemetry — Return latest 20 telemetry records
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const records = await Telemetry.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .lean();
      return res.status(200).json(records);
    }

    // In-memory fallback if MongoDB is not connected
    console.warn("[TELEMETRY] MongoDB not connected — returning in-memory records.");
    return res.status(200).json(inMemoryHistory.slice(0, 20));
  } catch (error) {
    console.error("[TELEMETRY] Error in GET /telemetry:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
