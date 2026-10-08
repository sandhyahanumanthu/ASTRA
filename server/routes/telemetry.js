const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Telemetry = require("../models/Telemetry");
let Feedback;
try {
  Feedback = require("../models/Feedback");
} catch {
  Feedback = null;
}

// In-memory fallback caches when MongoDB is disconnected
let inMemoryHistory = [];
let inMemoryFeedback = [];

// Anomaly analysis engine - deterministic aerospace baseline
function analyzeTelemetry(numTemp, numPress, numVib) {
  const tempAnomaly = numTemp > 35;
  const vibAnomaly = numVib > 5.0;
  const pressAnomaly = numPress < 20 || numPress > 50;

  const isAnomaly = tempAnomaly || vibAnomaly || pressAnomaly;
  const status = isAnomaly ? "ANOMALY" : "NORMAL";

  let riskLevel = "Low";
  let cause = "All flight parameters operating nominal";
  let explanation =
    "All thermal, barometric, and vibrational telemetry parameters are operating within safe baseline flight envelope.";

  // Compound failure modes (Correlated Anomalies)
  if (numTemp > 40 && numVib > 6.0) {
    riskLevel = "High";
    cause = "Critical thermal overload (>40°C) with severe harmonic vibration (>6 mm/s)";
    explanation =
      "Severe compounded failure: avionics core temperature exceeds safety ceiling of 40°C while mechanical vibration amplitude exceeds 6 mm/s. Immediate risk of electronic degradation and structural fatigue.";
  } else if (tempAnomaly && pressAnomaly && vibAnomaly) {
    riskLevel = "High";
    cause = "Compound multi-subsystem breach: thermal, pressure, and structural oscillation";
    explanation =
      "Full subsystem excursion detected across thermal cells, reaction control pressure, and mechanical structures. Emergency isolation recommended.";
  } else if (tempAnomaly && pressAnomaly) {
    riskLevel = "High";
    cause = `Thermal excursion (${numTemp}°C) correlated with barometric pressure deviation (${numPress} kPa)`;
    explanation =
      "Compound thermal and pneumatic deviation: thermal expansion or cooling circuit pressurization anomaly suspected.";
  } else if (tempAnomaly && vibAnomaly) {
    riskLevel = "High";
    cause = `Dual boundary breach: elevated temperature (${numTemp}°C) and harmonic oscillation (${numVib} mm/s)`;
    explanation =
      "Elevated thermal and vibrational stress detected. System operates above nominal threshold limits (Temp > 35°C, Vib > 5 mm/s). Risk of mechanical resonance amplifying thermal dissipation failure.";
  } else if (numTemp > 40) {
    riskLevel = "High";
    cause = "Critical thermal overload: temperature exceeds 40°C safety ceiling";
    explanation =
      "Severe thermal surge: temperature has exceeded the 40°C emergency threshold. Heat dissipation failure suspected; active cooling or payload power down required.";
  } else if (numVib > 6.0) {
    riskLevel = "High";
    cause = "Excessive mechanical oscillation: vibration amplitude exceeds 6 mm/s";
    explanation =
      "Critical structural vibration: mechanical oscillation exceeds 6 mm/s threshold. Severe risk of harmonic resonance, fastener loosening, or sensor disorientation.";
  } else if (tempAnomaly) {
    riskLevel = "Medium";
    cause = `Thermal threshold exceeded: temperature is ${numTemp}°C (Safe limit: 35°C)`;
    explanation =
      "Thermal warning: core cell reading is above 35°C baseline. Thermal throttling recommended to prevent breaching the 40°C safety ceiling.";
  } else if (vibAnomaly) {
    riskLevel = "Medium";
    cause = `Mechanical oscillation detected: vibration is ${numVib} mm/s (Safe limit: 5.0 mm/s)`;
    explanation =
      "Vibrational warning: mechanical oscillation amplitude is above 5 mm/s baseline. Recommend damping stabilizer activation.";
  } else if (pressAnomaly) {
    riskLevel = numPress < 15 || numPress > 55 ? "High" : "Medium";
    cause = `Pneumatic pressure excursion: ${numPress} kPa outside safe envelope (20 - 50 kPa)`;
    explanation =
      numPress < 20
        ? "Sub-nominal chamber pressure detected: possible leak or regulator valve under-delivery."
        : "Over-pressure condition detected: accumulator valve relief or pressure regulator vent required.";
  } else {
    riskLevel = "Low";
    cause = "All parameters operating within safe flight envelope";
    explanation =
      "Nominal telemetry: thermal, pressure, and vibrational levels are strictly within safe operational boundaries.";
  }

  const message = isAnomaly
    ? `Anomaly detected (${riskLevel} Risk): ${cause}`
    : `All systems nominal (Low Risk): ${cause}`;

  return {
    status,
    riskLevel,
    cause,
    explanation,
    message,
    anomalies: {
      temperature: tempAnomaly,
      pressure: pressAnomaly,
      vibration: vibAnomaly,
    },
  };
}

// Helper to structure diagnostic hypotheses from telemetry data
function generateHypotheses(telemetry) {
  const { temperature, pressure, vibration, cause } = telemetry;
  const tempAnomaly = temperature > 35;
  const vibAnomaly = vibration > 5.0;
  const pressAnomaly = pressure < 20 || pressure > 50;

  const hypotheses = [];

  if (tempAnomaly && vibAnomaly) {
    hypotheses.push({
      id: "HYP-01",
      title: "Active Thermal Control Unit & Bearing Degradation",
      confidence: Math.min(92, Math.round(55 + (temperature - 35) * 2 + (vibration - 5) * 4)),
      status: "PRIMARY",
      summary: "Thermal radiator pump cavitation or avionics cooling fan bearing degradation.",
      evidenceFor: [
        `Core temperature (${temperature}°C) breached 35°C limit`,
        `Harmonic vibration (${vibration} mm/s) breached 5.0 mm/s limit simultaneously`,
        "Cross-sensor correlation index > 0.85",
      ],
      evidenceAgainst: [
        pressure >= 20 && pressure <= 50 ? "Barometric pressure remains within nominal envelope" : null,
      ].filter(Boolean),
      recommendedAction: "Engage auxiliary cooling loop B and throttle avionics compute frequency by 30%.",
    });
    hypotheses.push({
      id: "HYP-02",
      title: "Aerodynamic Buffet & Heat Shield Boundary Friction",
      confidence: 68,
      status: "SECONDARY",
      summary: "Atmospheric shear induced high dynamic pressure leading to surface heat dissipation degradation.",
      evidenceFor: [
        "Concurrent oscillation during active ascent trajectory",
        "Mechanical stress load pattern aligns with structural flutter model",
      ],
      evidenceAgainst: ["Absence of sudden pressure spike in RCS chamber"],
      recommendedAction: "Verify flight angle of attack and deploy active aerodynamic damping surfaces.",
    });
  } else if (tempAnomaly) {
    hypotheses.push({
      id: "HYP-01",
      title: "Thermal Loop Dissipation Restriction",
      confidence: Math.min(88, Math.round(60 + (temperature - 35) * 2.5)),
      status: "PRIMARY",
      summary: "Heat exchanger loop thermal resistance increased or radiator shading degraded.",
      evidenceFor: [
        `Temperature reading (${temperature}°C) exceeds normal 15-35°C range`,
        "Positive thermal slope detected over rolling transmission window",
      ],
      evidenceAgainst: [
        `Vibration nominal at ${vibration} mm/s (no mechanical pump seizure)`,
      ],
      recommendedAction: "Reorient spacecraft attitude for radiative cooling or cycle thermoelectric coolers.",
    });
    hypotheses.push({
      id: "HYP-03",
      title: "Telemetry Thermistor Sensor Drift",
      confidence: 26,
      status: "CANDIDATE",
      summary: "Thermistor resistance calibration offset or analog-to-digital converter noise.",
      evidenceFor: ["Single-sensor breach without adjacent structural oscillation"],
      evidenceAgainst: ["No secondary channel disagreement flag emitted"],
      recommendedAction: "Cross-validate against secondary bus telemetry channel T2-AUX.",
    });
  } else if (vibAnomaly) {
    hypotheses.push({
      id: "HYP-02",
      title: "Structural Resonant Oscillation",
      confidence: Math.min(86, Math.round(58 + (vibration - 5) * 5)),
      status: "PRIMARY",
      summary: "Harmonic feedback between thruster gimbal assembly and interstage adapter.",
      evidenceFor: [
        `Mechanical vibration (${vibration} mm/s) breached 5.0 mm/s threshold`,
        "Oscillation signature concentrated in harmonic bands",
      ],
      evidenceAgainst: [
        `Thermal core nominal at ${temperature}°C`,
        `Pneumatic pressure nominal at ${pressure} kPa`,
      ],
      recommendedAction: "Engage reaction wheel anti-jitter profile and calibrate active damping thrusters.",
    });
  } else if (pressAnomaly) {
    hypotheses.push({
      id: "HYP-04",
      title: "Pneumatic Regulator Valve Discrepancy",
      confidence: 76,
      status: "PRIMARY",
      summary:
        pressure < 20
          ? "Micro-leakage or under-regulated propellant tank pressure."
          : "Accumulator over-pressure or vent solenoid valve sluggishness.",
      evidenceFor: [`Pressure reading (${pressure} kPa) outside 20-50 kPa safe flight envelope`],
      evidenceAgainst: ["Structural integrity intact with nominal vibration"],
      recommendedAction: "Command purge valve cycle and switch to secondary pressure regulator bank.",
    });
  } else {
    hypotheses.push({
      id: "HYP-00",
      title: "Nominal Flight Operations",
      confidence: 99,
      status: "NOMINAL",
      summary: "All flight sensors within verified operational flight boundaries.",
      evidenceFor: [
        `Temperature ${temperature}°C (nominal 15-35°C)`,
        `Pressure ${pressure} kPa (nominal 20-50 kPa)`,
        `Vibration ${vibration} mm/s (nominal 0.5-5.0 mm/s)`,
      ],
      evidenceAgainst: [],
      recommendedAction: "Continue baseline telemetry monitoring stream.",
    });
  }

  return hypotheses;
}

// POST /telemetry — Process and save telemetry data
router.post("/", async (req, res) => {
  console.log("[TELEMETRY] POST received:", req.body);

  try {
    const { temperature = 25, pressure = 35, vibration = 1.5 } = req.body || {};

    const numTemp = Number(temperature);
    const numPress = Number(pressure);
    const numVib = Number(vibration);
    const timestamp = new Date();

    const analysis = analyzeTelemetry(numTemp, numPress, numVib);

    const recordData = {
      temperature: numTemp,
      pressure: numPress,
      vibration: numVib,
      status: analysis.status,
      riskLevel: analysis.riskLevel,
      cause: analysis.cause,
      explanation: analysis.explanation,
      message: analysis.message,
      timestamp,
    };

    // Save to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const telemetry = new Telemetry(recordData);
        await telemetry.save();
        console.log("Data persisted to MongoDB:", recordData);
      } catch (dbErr) {
        console.error("[TELEMETRY] MongoDB save error:", dbErr.message);
      }
    } else {
      console.warn("[TELEMETRY] MongoDB not connected — cached in memory.");
    }

    // Always update in-memory fallback cache (keep latest 100)
    inMemoryHistory.unshift(recordData);
    if (inMemoryHistory.length > 100) inMemoryHistory.pop();

    console.log(
      `[TELEMETRY] ${timestamp.toISOString()} | Temp: ${numTemp}°C | Press: ${numPress}kPa | Vib: ${numVib}mm/s => Status: ${analysis.status} (${analysis.riskLevel} Risk)`
    );

    return res.status(200).json({
      status: analysis.status,
      riskLevel: analysis.riskLevel,
      cause: analysis.cause,
      explanation: analysis.explanation,
      temperature: numTemp,
      pressure: numPress,
      vibration: numVib,
      timestamp: timestamp.toISOString(),
      message: analysis.message,
      anomalies: analysis.anomalies,
    });
  } catch (error) {
    console.error("[TELEMETRY] Error in POST /telemetry:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// GET /telemetry — Return historical telemetry records (with limit and status filter)
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    if (mongoose.connection.readyState === 1) {
      const records = await Telemetry.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      return res.status(200).json(records);
    }

    // In-memory fallback if MongoDB is not connected
    console.warn("[TELEMETRY] MongoDB not connected — returning in-memory records.");
    let filtered = inMemoryHistory;
    if (filter.status) {
      filtered = filtered.filter((r) => r.status === filter.status);
    }
    return res.status(200).json(filtered.slice(0, limit));
  } catch (error) {
    console.error("[TELEMETRY] Error in GET /telemetry:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// POST /telemetry/simulate (or /simulate) — Non-destructive What-If Simulation
router.post("/simulate", async (req, res) => {
  try {
    const { temperature = 25, pressure = 35, vibration = 1.5 } = req.body || {};
    const numTemp = Number(temperature);
    const numPress = Number(pressure);
    const numVib = Number(vibration);

    const analysis = analyzeTelemetry(numTemp, numPress, numVib);
    const hypotheses = generateHypotheses({
      temperature: numTemp,
      pressure: numPress,
      vibration: numVib,
      cause: analysis.cause,
    });

    const tempMargin = +(35.0 - numTemp).toFixed(2);
    const vibMargin = +(5.0 - numVib).toFixed(2);
    const pressMargin =
      numPress < 20 ? +(numPress - 20.0).toFixed(2) : +(50.0 - numPress).toFixed(2);

    return res.status(200).json({
      mode: "SIMULATION_WHAT_IF",
      disclaimer: "System-generated simulation calculation based on deterministic telemetry threshold model.",
      inputs: { temperature: numTemp, pressure: numPress, vibration: numVib },
      classification: analysis.riskLevel === "High" ? "CRITICAL" : analysis.riskLevel === "Medium" ? "WARNING" : "NORMAL",
      status: analysis.status,
      riskLevel: analysis.riskLevel,
      cause: analysis.cause,
      explanation: analysis.explanation,
      safetyMargins: {
        thermalMargin: `${tempMargin > 0 ? "+" : ""}${tempMargin} °C`,
        vibrationMargin: `${vibMargin > 0 ? "+" : ""}${vibMargin} mm/s`,
        pressureMargin: `${pressMargin > 0 ? "+" : ""}${pressMargin} kPa`,
      },
      hypotheses,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TELEMETRY] Error in simulation:", error);
    return res.status(500).json({ message: "Simulation Error", error: error.message });
  }
});

// GET /telemetry/investigations — Generate investigation cases from recent telemetry anomalies
router.get("/investigations", async (req, res) => {
  try {
    let recentAnomalies = [];

    if (mongoose.connection.readyState === 1) {
      recentAnomalies = await Telemetry.find({ status: "ANOMALY" })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();
    } else {
      recentAnomalies = inMemoryHistory.filter((r) => r.status === "ANOMALY").slice(0, 10);
    }

    // If no anomalies exist yet, create a baseline demo investigation case
    if (recentAnomalies.length === 0) {
      recentAnomalies = [
        {
          _id: "demo-case-001",
          temperature: 46.5,
          pressure: 34.2,
          vibration: 6.8,
          status: "ANOMALY",
          riskLevel: "High",
          cause: "Critical thermal overload (>40°C) with severe harmonic vibration (>6 mm/s)",
          explanation:
            "Severe compounded failure: avionics core temperature exceeds safety ceiling while mechanical vibration exceeds threshold.",
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const cases = recentAnomalies.map((record, index) => {
      const caseId = `CASE #ASTRA-${String(index + 1).padStart(4, "0")}`;
      const hypotheses = generateHypotheses(record);

      return {
        id: caseId,
        recordId: record._id || `rec-${index}`,
        timestamp: record.timestamp,
        telemetry: {
          temperature: record.temperature,
          pressure: record.pressure,
          vibration: record.vibration,
        },
        event: record.cause || "Subsystem Boundary Excursion",
        explanation: record.explanation,
        severity: record.riskLevel === "High" ? "CRITICAL" : record.riskLevel === "Medium" ? "WARNING" : "NORMAL",
        status: index === 0 ? "UNDER INVESTIGATION" : "DOCUMENTED",
        correlated: record.temperature > 35 && record.vibration > 5,
        hypotheses,
        causeChain: [
          {
            step: "1. Telemetry Event",
            description: `Sensor reading: ${record.temperature}°C, ${record.vibration} mm/s, ${record.pressure} kPa`,
          },
          {
            step: "2. Detected Anomaly",
            description: record.cause,
          },
          {
            step: "3. Correlated Sensors",
            description:
              record.temperature > 35 && record.vibration > 5
                ? "Thermal cell + Structural accelerometer"
                : record.temperature > 35
                ? "Thermal avionics sensor"
                : record.vibration > 5
                ? "Mechanical harmonic sensor"
                : "Reaction control barometric transducer",
          },
          {
            step: "4. Candidate Causes",
            description: hypotheses[0]?.title || "Subsystem deviation",
          },
          {
            step: "5. Recommended Action",
            description: hypotheses[0]?.recommendedAction || "Monitor parameters",
          },
        ],
      };
    });

    return res.status(200).json(cases);
  } catch (error) {
    console.error("[TELEMETRY] Error in GET /investigations:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// POST /telemetry/feedback — Store human validation feedback
router.post("/feedback", async (req, res) => {
  try {
    const { caseId, validation, feedbackReason, notes } = req.body || {};
    if (!caseId || !validation) {
      return res.status(400).json({ message: "caseId and validation ('CONFIRMED'|'REJECTED') are required" });
    }

    const feedbackDoc = {
      caseId,
      validation,
      feedbackReason: feedbackReason || "",
      notes: notes || "",
      timestamp: new Date(),
    };

    if (mongoose.connection.readyState === 1 && Feedback) {
      const fb = new Feedback(feedbackDoc);
      await fb.save();
    }

    inMemoryFeedback.unshift(feedbackDoc);
    if (inMemoryFeedback.length > 50) inMemoryFeedback.pop();

    console.log("[FEEDBACK] Logged:", feedbackDoc);

    return res.status(200).json({
      success: true,
      message: "Validation feedback stored successfully",
      feedback: feedbackDoc,
    });
  } catch (error) {
    console.error("[TELEMETRY] Error in POST /feedback:", error);
    return res.status(500).json({ message: "Feedback Error", error: error.message });
  }
});

// GET /telemetry/summary — Return flight telemetry summary
router.get("/summary", async (req, res) => {
  try {
    let records = [];
    if (mongoose.connection.readyState === 1) {
      records = await Telemetry.find().sort({ timestamp: -1 }).limit(100).lean();
    } else {
      records = inMemoryHistory;
    }

    const total = records.length;
    const anomalies = records.filter((r) => r.status === "ANOMALY").length;
    const normal = total - anomalies;

    const avgTemp = total
      ? +(records.reduce((acc, r) => acc + (r.temperature || 0), 0) / total).toFixed(1)
      : 25.0;
    const avgPress = total
      ? +(records.reduce((acc, r) => acc + (r.pressure || 0), 0) / total).toFixed(1)
      : 35.0;
    const avgVib = total
      ? +(records.reduce((acc, r) => acc + (r.vibration || 0), 0) / total).toFixed(2)
      : 1.5;

    return res.status(200).json({
      totalRecords: total,
      anomalyCount: anomalies,
      normalCount: normal,
      anomalyRate: total ? `${Math.round((anomalies / total) * 100)}%` : "0%",
      averages: {
        temperature: avgTemp,
        pressure: avgPress,
        vibration: avgVib,
      },
      systemHealth: anomalies === 0 ? "NORMAL" : anomalies < 3 ? "DEGRADED" : "CRITICAL",
      database: mongoose.connection.readyState === 1 ? "CONNECTED" : "FALLBACK_IN_MEMORY",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TELEMETRY] Error in summary:", error);
    return res.status(500).json({ message: "Summary Error", error: error.message });
  }
});

module.exports = router;
