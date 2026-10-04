const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.warn("⚠️ MONGO_URI environment variable is not defined.");
    console.warn("⚠️ Telemetry will operate with in-memory caching fallback until MONGO_URI is set.");
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
  }
};

module.exports = connectDB;
