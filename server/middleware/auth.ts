import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/ErrorHandle';
import jwt, { JwtPayload } from 'jsonwebtoken';
import userModel from '../models/usermodel'; // Assuming you have a user model
import { redis } from '../utils/redis';

// Middleware to check if the user is authenticated
export const IsAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const access_token = req.cookies.access_token; // Assuming you're using cookies to store the JWT

  // Check if the access token exists in cookies
  if (!access_token) {
    return next(new CustomError("Please login to access the resources", 401)); // Return 401 Unauthorized
  }

  try {
    // Verify the JWT using the secret key
    const decoded = jwt.verify(access_token, process.env.ACTIVE_TOKEN as string) as JwtPayload;
if(!decoded){
    return next(new CustomError("acess token is not valid",400))
}
    // Find the user by the ID stored in the token
    const user = await redis.get(decoded.id);

    // If the user doesn't exist, throw an error
    if (!user) {
      return next(new CustomError("User not found", 404));
    }

    // Attach the authenticated user to the request object for further use
    req.user = JSON.parse(user)

    // Call the next middleware or route handler
    next();
  } catch (error) {
    console.log(error);
    return next(new CustomError("Invalid or expired token", 401)); // Handle invalid token
  }
};
