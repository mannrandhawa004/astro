import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/response.js";
import { cookieOptionsForAcessToken } from "../controllers/cookie.config.js";
import { findUserById } from "../dao/auth.dao.js";
import { signToken } from "../utils/token.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        if (accessToken) {
            try {
                const decodedUser = jwt.verify(accessToken, process.env.JWT_SECERET_KEY);
                const user = await findUserById(decodedUser.id);

                if (!user) {
                    return errorResponse(res, "Unauthorized - User no longer exists", 401);
                }

                // console.log(decodedUser)

                // --- SINGLE DEVICE CHECK ---
                // If the sessionId in the cookie doesn't match the one in DB, 
                // it means someone else logged in elsewhere.
                if (user.activeSessionId !== decodedUser.sessionId) {
                    return errorResponse(res, "Unauthorized - Logged in from another device", 401);
                }

                req.user = user;
                return next();
            } catch (err) {
                console.log("Access token invalid, attempting refresh...");
            }
        }

    
        if (!refreshToken) {
            return errorResponse(res, "Unauthorized - Please login to continue", 401);
        }

        try {
            const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESHTOKEN_SECERET_KEY);
            const user = await findUserById(decodedRefresh.id);

            // Verify the token exists in DB and matches the cookie (Prevents reuse of old tokens)
            if (!user || user.refreshToken !== refreshToken) {
                return errorResponse(res, "Session expired - Please login again", 401);
            }

            // --- RE-ISSUE ACCESS TOKEN ---
            // We take the current activeSessionId from the user record
            // and bake it back into the new Access Token.
            const newAccessToken = await signToken({
                id: user._id,
                email: user.email,
                role: user.role,
                sessionId: user.activeSessionId // Maintain the session link
            });

            // Set the new cookie
            res.cookie("accessToken", newAccessToken, cookieOptionsForAcessToken);

            req.user = user;
            return next();
        } catch (err) {
            console.log("Refresh token invalid:", err.message);
            return errorResponse(res, "Unauthorized - Session invalid", 401);
        }
    } catch (err) {
        console.error("Auth middleware global error:", err.message);
        return errorResponse(res, "Internal Server Error", 500);
    }
};