import mongoose from "mongoose";
import crypto from "crypto";

const astrologerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    specialization: { type: String, required: true },
    experienceYears: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    profileImage: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    price: { type: Number, required: true, default: 50 },


    activeSessionId: { type: String, default: null },
    refreshToken: { type: String, default: null },
    currentStatus: {
      type: String,
      enum: ["online", "offline", "busy"],
      default: "offline"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true
    }
  },
  { timestamps: true }
);




const Astrologer = mongoose.model("Astrologer", astrologerSchema);
export default Astrologer;