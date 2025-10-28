import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  month: String,
  year: Number,
  totalClicks: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("History", historySchema);
