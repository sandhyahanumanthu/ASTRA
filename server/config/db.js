const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (attempt = 1) => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI || mongoURI === "your_mongodb_connection_string_here") {
    console.warn("⚠️  MONGO_URI is not set or still contains the placeholder value.");
    console.warn("⚠️  Set MONGO_URI in server/.env (local) or Render Environment Variables (production).");
    console.warn("⚠️  Telemetry will use in-memory fallback until MONGO_URI is configured.");
    return;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for initial connection
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error(`❌ MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}):`, error.message);

    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => connectDB(attempt + 1), RETRY_DELAY_MS);
    } else {
      console.error("❌ MongoDB connection failed after maximum retries. Running with in-memory fallback.");
    }
  }
};

// Graceful disconnect events
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Reconnecting...");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

module.exports = connectDB;
