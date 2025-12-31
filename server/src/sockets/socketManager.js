import { createToken } from "../config/livekit.js";
import authModel from "../models/auth.model.js";
import Astrologer from "../models/astrologer.model.js";
import CallTransaction from "../models/callTransaction.model.js";

const onlineUsers = new Map();
const callTimers = new Map();
const disconnectTimers = {}; // FIX: Defined the missing variable

export const setupSocketIO = (io) => {
    io.on("connection", (socket) => {
        
        // --- 1. Registration ---
        socket.on("register", (userId) => {
            if (userId) {
                onlineUsers.set(userId, socket.id);
                // Important: Attach ID to the socket instance so we know who disconnects later
                socket.userId = userId; 
            }
        });

        // --- 2. Call Request ---
        socket.on("call_request", (data) => {
            const { callerId, callerName, receiverId, durationSeconds } = data;
            const receiverSocketId = onlineUsers.get(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("incoming_call", {
                    callerId, callerName, durationSeconds,
                    roomId: `room-${callerId}-${receiverId}`
                });
            } else {
                socket.emit("call_failed", { message: "Astrologer is offline." });
            }
        });

        // --- 3. Accept Call ---
        socket.on("accept_call", async (data) => {
            const { callerId, receiverId, roomId, durationSeconds } = data;

            try {
                const [user, astro] = await Promise.all([
                    authModel.findById(callerId),
                    Astrologer.findById(receiverId)
                ]);

                // Balance Check Logic
                const minutes = durationSeconds / 60;
                const totalCost = astro.price * minutes;

                if (user.walletBalance < totalCost) {
                    socket.emit("call_failed", { message: "User balance low." });
                    const callerSocketId = onlineUsers.get(callerId);
                    if (callerSocketId) io.to(callerSocketId).emit("call_failed", { message: "Insufficient balance." });
                    return;
                }

                // Deduct Balance
                user.walletBalance -= totalCost;
                await user.save();

                await CallTransaction.create({
                    userId: user._id,
                    astrologerId: astro._id,
                    amount: totalCost,
                    durationMinutes: minutes
                });

                // Generate LiveKit Tokens
                const tokenCaller = await createToken(callerId, roomId, user.fullName);
                const tokenReceiver = await createToken(receiverId, roomId, astro.name);

                const callerSocketId = onlineUsers.get(callerId);

                // --- CRITICAL FIX: JOIN SOCKETS TO ROOM MANUALLY ---
                // 1. Join Caller (User)
                if (callerSocketId) {
                    const callerSocket = io.sockets.sockets.get(callerSocketId);
                    if (callerSocket) {
                        callerSocket.join(roomId);
                        callerSocket.roomId = roomId;
                        callerSocket.userId = callerId;
                    }
                }
                
                // 2. Join Receiver (Astrologer - current socket)
                socket.join(roomId);
                socket.roomId = roomId;
                socket.userId = receiverId;

                // Send Response
                if (callerSocketId) {
                    io.to(callerSocketId).emit("call_accepted", { 
                        roomId, 
                        token: tokenCaller,
                        callerId: callerId // Send this so Astro knows who called
                    });
                }
                
                socket.emit("call_accepted", { 
                    roomId, 
                    token: tokenReceiver, 
                    callerId: callerId 
                });

                // Start Session Timer (Hard Limit)
                const timer = setTimeout(() => {
                    io.to(roomId).emit("force_disconnect");
                }, durationSeconds * 1000);

                callTimers.set(roomId, timer);
                
            } catch (err) {
                console.error("Accept Error:", err);
            }
        });

        // --- 4. Disconnect Handling (The Grace Period) ---
        socket.on("disconnect", () => {
            const userId = socket.userId;
            const roomId = socket.roomId; // This is now available because we attached it above

            if (userId) onlineUsers.delete(userId);

            if (userId && roomId) {
                console.log(`User ${userId} disconnected from room ${roomId}. Waiting 15s...`);
                
                // Start a timer to kill the call ONLY if they don't come back
                disconnectTimers[userId] = setTimeout(() => {
                    console.log(`Time up. Ending call for room ${roomId}`);
                    io.to(roomId).emit('force_disconnect'); 
                    delete disconnectTimers[userId];
                }, 15000); // 15 Seconds Grace Period
            }
        });

        // --- 5. Reconnection Logic ---
        socket.on('user_reconnected', ({ userId, roomId }) => {
            if (disconnectTimers[userId]) {
                console.log(`User ${userId} reconnected! Cancelling disconnect timer.`);
                // CANCEL THE DISCONNECT
                clearTimeout(disconnectTimers[userId]);
                delete disconnectTimers[userId];

                // Re-join the socket room
                socket.join(roomId);
                socket.userId = userId;
                socket.roomId = roomId;
                onlineUsers.set(userId, socket.id);
            }
        });
    });
};