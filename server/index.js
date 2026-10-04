require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// 1. CORS Configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

// 2. Body Parser Middleware
app.use(express.json());

// 3. Connect to MongoDB using process.env.MONGO_URI
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.warn("⚠️ MONGO_URI is not set. Please set MONGO_URI in your environment variables.");
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
};

connectDB();

// 4. Telemetry Schema & Model
const telemetrySchema = new mongoose.Schema({
  temperature: Number,
  pressure: Number,
  vibration: Number,
  status: String,
  riskLevel: String,
  cause: String,
  explanation: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Telemetry = mongoose.models.Telemetry || mongoose.model("Telemetry", telemetrySchema);

// 5. Smart Anomaly Detection Engine
function analyzeTelemetry(numTemp, numPress, numVib) {
  // Logic: If temperature > 35 OR vibration > 5 → ANOMALY, Else → NORMAL
  const isAnomaly = numTemp > 35 || numVib > 5;
  const status = isAnomaly ? "ANOMALY" : "NORMAL";

  let riskLevel = "Low";
  let cause = "All flight parameters operating nominal";
  let explanation = "All thermal, barometric, and vibrational telemetry parameters are operating within safe baseline flight envelope.";

  if (numTemp > 40 && numVib > 6) {
    riskLevel = "High";
    cause = "Critical thermal overload (>40°C) with severe harmonic vibration (>6 mm/s)";
    explanation = "Severe compounded failure: avionics core temperature exceeds safety ceiling of 40°C while mechanical vibration amplitude exceeds 6 mm/s. Immediate risk of electronic degradation and structural fatigue.";
  } else if (numTemp > 40) {
    riskLevel = "High";
    cause = "Critical thermal overload: temperature exceeds 40°C safety ceiling";
    explanation = "Severe thermal surge: temperature has exceeded the 40°C emergency threshold. Heat dissipation failure suspected; active cooling or payload power down required.";
  } else if (numVib > 6) {
    riskLevel = "High";
    cause = "Excessive mechanical oscillation: vibration amplitude exceeds 6 mm/s";
    explanation = "Critical structural vibration: mechanical oscillation exceeds 6 mm/s threshold. Severe risk of harmonic resonance, fastener loosening, or sensor disorientation.";
  } else if (numTemp > 35 && numVib > 5) {
    riskLevel = "Medium";
    cause = "Dual boundary breach: elevated temperature (>35°C) and harmonic oscillation (>5 mm/s)";
    explanation = "Elevated thermal and vibrational stress detected. System operates above nominal threshold limits (Temp > 35°C, Vib > 5 mm/s).";
  } else if (numTemp > 35) {
    riskLevel = "Medium";
    cause = "Thermal threshold exceeded: temperature is above 35°C";
    explanation = "Thermal warning: core cell reading is above 35°C baseline. Thermal throttling recommended to prevent breaching the 40°C safety ceiling.";
  } else if (numVib > 5) {
    riskLevel = "Medium";
    cause = "Mechanical oscillation detected: vibration is above 5 mm/s";
    explanation = "Vibrational warning: mechanical oscillation amplitude is above 5 mm/s baseline. Recommend damping stabilizer activation.";
  } else {
    riskLevel = "Low";
    cause = "All parameters operating within safe flight envelope";
    explanation = "Nominal telemetry: thermal, pressure, and vibrational levels are strictly within safe operational boundaries.";
  }

  const message = isAnomaly
    ? `Anomaly detected (${riskLevel} Risk): ${cause}`
    : `All systems nominal (Low Risk): ${cause}`;

  return { status, riskLevel, cause, explanation, message };
}

// 6. Root Route: GET /
app.get("/", (req, res) => {
  res.send("Astra Backend Running");
});

let inMemoryHistory = [];

// 7. GET /telemetry - Retrieve latest telemetry records (last 20 entries)
app.get("/telemetry", async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const records = await Telemetry.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .lean();
      return res.status(200).json(records);
    }
    return res.status(200).json(inMemoryHistory.slice(0, 20));
  } catch (err) {
    console.error("Error fetching telemetry:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 8. POST /telemetry - Process and save telemetry with smart explanation
app.post("/telemetry", async (req, res) => {
  console.log("Telemetry request received:", req.body);

  try {
    const { temperature, pressure, vibration } = req.body || {};

    const numTemp = Number(temperature);
    const numPress = Number(pressure);
    const numVib = Number(vibration);

    const timestamp = new Date();

    // Run smart anomaly analysis
    const { status, riskLevel, cause, explanation, message } = analyzeTelemetry(
      numTemp,
      numPress,
      numVib
    );

    const record = {
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

    // Save data to in-memory history
    inMemoryHistory.unshift(record);
    if (inMemoryHistory.length > 50) inMemoryHistory.pop();

    // Save data to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      const telemetry = new Telemetry(record);
      await telemetry.save();
      console.log("Telemetry data saved to MongoDB successfully");
    } else {
      console.warn("MongoDB not connected. Data not persisted.");
    }

    // Return status, riskLevel, explanation alongside full telemetry record
    return res.status(200).json({
      status,
      riskLevel,
      explanation,
      cause,
      temperature: numTemp,
      pressure: numPress,
      vibration: numVib,
      timestamp,
      message,
    });
  } catch (err) {
    console.error("Error saving telemetry:", err);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 9. Port Configuration for Render Deployment
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});