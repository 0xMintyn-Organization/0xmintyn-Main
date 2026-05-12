require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.mode";


interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none' | undefined;
    secure?: boolean;

}

// Access token (1 hour lifespan for better UX)
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '60', 10);

// Refresh token (long lifespan, e.g. 5 days)
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '432000', 10);

// Use SameSite=None; Secure when production, or cross-origin login (website -> API -> MVP). Required so cookies are stored on cross-origin response.
// Auto-enabled when CORS_ORIGINS has 2+ origins, or when unset we use same default list as app.ts so local dev (multiple origins) gets cross-origin cookies.
// With SameSite=None, Secure is required — API must be HTTPS (or localhost HTTPS in dev).
const corsOriginsRaw = process.env.CORS_ORIGINS;
const corsOrigins = corsOriginsRaw
  ? corsOriginsRaw.split(',').map((o) => o.trim()).filter(Boolean)
  : [
      'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://localhost:3000',
      'https://www.equalmint.com',
    ];
const useCrossOriginCookies =
  process.env.NODE_ENV === 'production' ||
  process.env.COOKIE_SAME_SITE_NONE === 'true' ||
  corsOrigins.length >= 2;

export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: useCrossOriginCookies ? 'none' : 'lax',
    secure: useCrossOriginCookies,
}

export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: useCrossOriginCookies ? 'none' : 'lax',
    secure: useCrossOriginCookies,
}

/** Options to use when clearing auth cookies (must match how they were set). */
export const clearCookieOptions = {
    httpOnly: true,
    sameSite: (useCrossOriginCookies ? 'none' : 'lax') as 'strict' | 'lax' | 'none',
    secure: useCrossOriginCookies,
    path: '/',
}



export const sendToken = (user: IUser, statusCode: number, res: Response, extra?: Record<string, unknown>) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
        ...extra,
    });
}