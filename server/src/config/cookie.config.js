const isProduction = process.env.NODE_ENV === "production";

export const cookieOptionsForAcessToken = {
    httpOnly: true,
    path: "/",
    maxAge: 180 * 60 * 1000,
    // If true, cookie is sent only over HTTPS. Required for SameSite="none"
    secure: isProduction, 
    // "none" allows cross-site usage (e.g. frontend.com calling backend.api.com)
    sameSite: isProduction ? "none" : "lax",
};

export const cookieOptionsForRefreshToken = {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
};