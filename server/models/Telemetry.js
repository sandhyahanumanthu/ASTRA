const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
  temperature: {
    type: Number,
    required: true,
  },
  pressure: {
    type: Number,
    required: true,
  },
  vibration: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["NORMAL", "ANOMALY"],
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low",
  },
  cause: {
    type: String,
    default: "",
  },
  explanation: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Telemetry", telemetrySchema);
