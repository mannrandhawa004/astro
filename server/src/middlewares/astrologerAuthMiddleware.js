import jwt from "jsonwebtoken";
import Astrologer from "../models/astrologer.model.js";
import { errorResponse } from "../utils/response.js";

export const astrologerMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return errorResponse(res, "Unauthorized - No token provided", 401);

    const decoded = jwt.verify(token, process.env.JWT_SECERET_KEY);
    const astrologer = await Astrologer.findById(decoded.id);

    if (!astrologer) {
      return errorResponse(res, "Astrologer not found", 401);
    }

 
    if (astrologer.activeSessionId !== decoded.sessionId) {
      return errorResponse(res, "Session expired - Logged in from another device", 401);
    }

    req.astrologer = astrologer;
    next();
  } catch (error) {
    return errorResponse(res, "Invalid session", 401);
  }
};