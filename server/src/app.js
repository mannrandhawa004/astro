import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./utils/errorHanlder.js";

import userRoutes from "./routes/auth.routes.js";
import astrologerRoutes from "./routes/astrologer.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import callRoutes from "./routes/call.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import kundliRoutes from "./routes/kundli.routes.js";

const app = express();

app.set("trust proxy", 1); 


const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:3000",
    "https://astro-lilac-chi.vercel.app"
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true, // Essential for sending cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/astrologer", astrologerRoutes);
app.use("/session", sessionRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/call", callRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/kundli", kundliRoutes);

app.use(errorHandler);

export default app;