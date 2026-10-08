const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
  },
  validation: {
    type: String,
    enum: ["CONFIRMED", "REJECTED"],
    required: true,
  },
  feedbackReason: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
