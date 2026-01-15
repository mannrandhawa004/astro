import { createAstrologer, findAstrologerByEmail, findAllActiveAstrologers, updateAstrologerById, deleteAstrologerById } from "../dao/astrologer.dao.js";
import { ConflictError, NotFoundError } from "../utils/errorHanlder.js"; // Check spelling of errorHandler
import AstrologerModel from '../models/astrologer.model.js';
import { v4 as uuidv4 } from 'uuid';
import { signToken, signRefreshToken } from "../utils/token.js";

export const addAstrologerService = async (astroData) => {
    const existingAstrologer = await findAstrologerByEmail(astroData.email);
    if (existingAstrologer) {
        throw new ConflictError("Astrologer with this email already exists");
    }
    return await createAstrologer(astroData);
}

export const getAllAstrologersService = async (query) => {
    return await findAllActiveAstrologers();
}



export const loginAstrologerServices = async (email) => {
    const astrologer = await AstrologerModel.findOne({ email });
    if (!astrologer) throw new NotFoundError("Astrologer not found");

    const sessionId = uuidv4();
    const token = await signToken({
        id: astrologer._id,
        email: astrologer.email,
        role: "astrologer",
        sessionId: sessionId
    });

    const refreshToken = await signRefreshToken({
        id: astrologer._id,
        sessionId: sessionId
    });

    astrologer.activeSessionId = sessionId;
    astrologer.refreshToken = refreshToken;
    // astrologer.currentStatus = "online";
    await astrologer.save();

    return { astrologer, token, refreshToken };
};

export const updateAstrologerService = async (id, updateData) => {
    const updatedAstro = await updateAstrologerById(id, updateData);
    if (!updatedAstro) throw new NotFoundError("Astrologer not found");
    return updatedAstro;
};

export const deleteAstrologerService = async (id) => {
    const deletedAstro = await deleteAstrologerById(id);
    if (!deletedAstro) throw new NotFoundError("Astrologer not found");
    return deletedAstro;
};