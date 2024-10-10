require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/usermodel";
import { Types } from "mongoose";
import { redis } from "./redis";
interface ItokenOption {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined; // Fixed typo: changed "senSite" to "sameSite"
  secure: boolean;
}
 // Parse environment variables with fallback values
 const activTokenExpire = parseInt(
  process.env.ACTIVE_TOKEN_EXPIRE || "300",
  10
); // Fallback to 300 seconds (5 minutes)
const RefreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
); // Fallback to 1200 seconds (20 minutes)

// Set options for access token cookie
 export const activetokenOptions: ItokenOption = {
  expires: new Date(Date.now() + activTokenExpire *60*60* 1000), // Active token expiration in ms
  maxAge: activTokenExpire *60*60* 1000,
  httpOnly: true, // Cookie can't be accessed via client-side JavaScript
  sameSite: "lax", // SameSite setting
  secure: process.env.NODE_ENV === "production", // Secure only in production (HTTPS)
};

// Set options for refresh token cookie
 export const refreshTokenOptions: ItokenOption = {
  expires: new Date(Date.now() + RefreshTokenExpire*24*60*60 * 1000), // Refresh token expiration in ms
  maxAge: RefreshTokenExpire*24*60*60 * 1000,
  httpOnly: true, // Prevent access via client-side JavaScript
  sameSite: "lax", // SameSite setting
  secure: process.env.NODE_ENV === "production", // Secure only in production (HTTPS)
};

// Async function to handle token sending
export const sendToken = async (
  user: IUser, 
  statusCode: number,
  res: Response
) => {
  // Generate access and refresh tokens
  const accessToken = await user.SignAcessToken();
  const refreshToken = await user.SignRefreshToken();

 
  // Send tokens in HTTP-only cookies
  res.cookie("accessToken", accessToken, activetokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);

  // Optionally, store the refresh token in Redis for managing session persistence
  await redis.set(
    user._id.toString(),
    JSON.stringify({ refreshToken }),
    "EX",
    RefreshTokenExpire
  );

  // Respond with success message
  res.status(statusCode).json({
    success: true,
    user,
    message: "Tokens have been issued",
  });
};
