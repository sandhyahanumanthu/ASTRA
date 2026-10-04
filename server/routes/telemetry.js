const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Telemetry = require("../models/Telemetry");

// In-memory fallback cache when MongoDB is disconnected
let inMemoryHistory = [];

// POST /telemetry
router.post("/", async (req, res) => {
  try {
    const { temperature = 25, pressure = 35, vibration = 1.5 } = req.body || {};

    const numTemp = Number(temperature);
    const numPress = Number(pressure);
    const numVib = Number(vibration);

    // Core rule: IF temperature > 35 OR vibration > 5 → ANOMALY, ELSE NORMAL
    const isAnomaly = numTemp > 35 || numVib > 5;
    const status = isAnomaly ? "ANOMALY" : "NORMAL";
    const timestamp = new Date();

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

    const recordData = {
      temperature: numTemp,
      pressure: numPress,
      vibration: numVib,
      status,
      message,
      timestamp,
      reason,
      risk,
    };

    // Save into MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      const telemetry = new Telemetry(recordData);
      await telemetry.save();
    }

    // Also update in-memory cache for fallback and fast timeline access
    inMemoryHistory.unshift(recordData);
    if (inMemoryHistory.length > 50) inMemoryHistory.pop();

    console.log(
      `[TELEMETRY] ${timestamp.toISOString()} | Temp: ${numTemp}°C | Press: ${numPress}kPa | Vib: ${numVib}mm/s => Status: ${status}`
    );

    return res.status(200).json({
      status,
      temperature: numTemp,
      pressure: numPress,
      vibration: numVib,
      timestamp: timestamp.toISOString(),
      message,
      reason,
      risk,
      data: recordData,
    });
  } catch (error) {
    console.error("Error in POST /telemetry:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

// GET /telemetry
// Return latest telemetry records, sorted by timestamp (latest first), limit to last 20 entries
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const records = await Telemetry.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .lean();
      return res.status(200).json(records);
    }

    // In-memory fallback if database connection is pending
    return res.status(200).json(inMemoryHistory.slice(0, 20));
  } catch (error) {
    console.error("Error in GET /telemetry:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
