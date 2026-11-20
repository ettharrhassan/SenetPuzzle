import mongoose from "mongoose";

const communityImageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  dataUrl: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.CommunityImage || mongoose.model("CommunityImage", communityImageSchema);
