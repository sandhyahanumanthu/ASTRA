require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const telemetryRoutes = require("./routes/telemetry");

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

// 3. Connect to MongoDB
connectDB();

// 4. Root Route
app.get("/", (req, res) => {
  res.send("Backend is alive");
});

// Health check endpoint — returns JSON status for monitoring
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: "ok",
    service: "Astra Telemetry Backend",
    uptime: Math.floor(process.uptime()) + "s",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// 5. Telemetry Routes
app.use("/telemetry", telemetryRoutes);

// 6. Port Configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});