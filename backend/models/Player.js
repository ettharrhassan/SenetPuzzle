import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    cycleNumber: { type: Number, required: true, min: 1, max: 999 },
  },
  { timestamps: true },
);

export default mongoose.model("Player", playerSchema);
