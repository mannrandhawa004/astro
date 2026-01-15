import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const authSchema = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["user", "astrologer", "admin"], default: "user" },
        activeSessionId: { type: String, default: null },

        refreshToken: { type: String, default: null },
        profileImage: { type: String },
        walletBalance: { type: Number, default: 0 },
        isBlocked: { type: Boolean, default: false },

        resetPasswordToken: String,
        resetPasswordExpire: Date
    },
    { timestamps: true }
);


authSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return 
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
});

// Helper: Compare Password
authSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

authSchema.methods.createNewSession = async function (refreshToken) {
    const sessionId = crypto.randomBytes(16).toString("hex");
    this.activeSessionId = sessionId;
    this.refreshToken = refreshToken;
    await this.save();
    return sessionId;
};

const authModel = mongoose.model("auth", authSchema);
export default authModel;