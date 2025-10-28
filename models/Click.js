import mongoose from "mongoose";

const clickSchema = new mongoose.Schema({
  url: String,
  page: String,
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Click", clickSchema);
