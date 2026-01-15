import userModel from "../models/auth.model.js"
import { createUser, findUserByEmail, updateRefreshToken } from "../dao/auth.dao.js"
import { AppError, BadRequestError, ConflictError } from "../utils/errorHanlder.js"
import { signToken, signRefreshToken } from "../utils/token.js"
import crypto from "crypto"
import axios from "axios"
import { v4 as uuidv4 } from 'uuid';


export const registerUserServices = async (fullname, email, password, role = "user") => {
    const userAlreadyExists = await findUserByEmail(email);
    if (userAlreadyExists) throw new ConflictError("User already exists");

    const newUser = await createUser(fullname, email, password, role);
    if (!newUser) throw new AppError("User creation failed");

    const sessionId = uuidv4();

    const accessToken = await signToken({
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        sessionId: sessionId
    });

    const refreshToken = await signRefreshToken({
        id: newUser._id,
        sessionId: sessionId
    });

    newUser.refreshToken = refreshToken;
    newUser.activeSessionId = sessionId;
    const updatedUser = await newUser.save();

    return {
        user: updatedUser,
        accessToken,
        refreshToken
    };
}

export const loginUserService = async (email, password) => {
    const existingUser = await findUserByEmail(email);
    if (!existingUser) throw new BadRequestError("Invalid email or password");

    const isPasswordValid = await existingUser.comparePassword(password);
    if (!isPasswordValid) throw new BadRequestError("Invalid email or password");

    const sessionId = uuidv4();

    const accessToken = await signToken({
        id: existingUser._id,
        email: existingUser.email,
        role: existingUser.role,
        sessionId: sessionId
    });

    const refreshToken = await signRefreshToken({
        id: existingUser._id,
        sessionId: sessionId // ADD THIS
    });

    existingUser.refreshToken = refreshToken;
    existingUser.activeSessionId = sessionId;
    const updatedUser = await existingUser.save();

    return { user: updatedUser, accessToken, refreshToken };
}

export const googleLoginService = async (accessToken) => {
    try {
        const googleResponse = await axios.get(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
        );

        const { sub: googleId, email, name, picture } = googleResponse.data;
        let user = await userModel.findOne({ email });

        if (!user) {
            const dummyPassword = crypto.randomBytes(16).toString("hex");
            user = await userModel.create({
                fullName: name,
                email,
                password: dummyPassword,
                googleId,
                profileImage: picture,
                role: "user"
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            user.profileImage = picture;
        }

        // GENERATE UUID
        const sessionId = uuidv4();

        const token = await signToken({
            id: user._id,
            email: user.email,
            role: user.role,
            sessionId: sessionId // ADD THIS
        });

        const refreshToken = await signRefreshToken({
            id: user._id,
            email: user.email,
            sessionId: sessionId // ADD THIS
        });

        // UPDATE DB
        user.refreshToken = refreshToken;
        user.activeSessionId = sessionId;
        await user.save({ validateBeforeSave: false });

        return { user, token, refreshToken };
    } catch (error) {
        throw new AppError("Failed to authenticate with Google", 400);
    }
}
