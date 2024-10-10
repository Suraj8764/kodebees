import { Request, Response, NextFunction } from "express";
import userModel from "../models/usermodel";
import IUser from "../models/usermodel";
import ejs from "ejs";
const dotenv = require("dotenv");
dotenv.config();
import { CustomError } from "../utils/ErrorHandle"; // Use the CustomError class, not errorHandler
import jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path, { dirname } from "path";
import sendMail from "../utils/sendMail";
import { activetokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";

// Define the interface for the registration body
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string; // Optional avatar field
}

// Register a new user
export const registrationUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body as IRegistrationBody;

    // Check if the user with the given email already exists
    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist) {
      return next(new CustomError("Email already exists", 400)); // Use CustomError to handle error
    }

    // Create the new user using the Mongoose model
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword, "hss");
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const activationToken = createActivationToken(user); // Pass the user ID instead of the entire user object
    const activationcode = activationToken.activationCode;
    const data = { user: { name: user.name }, activationcode };
    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/activation-email.ejs"),
      data
    );

    try {
      await sendMail({
        email: user.email,
        subject: "Active your Account",
        template: "activation-email",
        data,
      });
      res.status(201).json({
        success: true,
        message: `please Check your Mail : ${user.email} to Activate your account`,
        activationToken: activationToken.token,
      });
    } catch (error: any) {
      return next(new CustomError(error.message, 400));
    }
  } catch (error) {
    console.log(error, "error");
    return next(new CustomError("Error registering user", 500)); // Catch any unexpected errors
  }
};

// Define the interface for the activation token
interface IActivationToken {
  token: string;
  activationCode: string;
}

// Function to create an activation token for the user
export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user, // Only store the user ID in the token payload
      activationCode,
    },
    process.env.ACTIVATION_SECRET || "458599490039", // Replace with your actual secret in the .env file
    {
      expiresIn: "5m", // Token will expire in 5 minutes
    }
  );

  return { token, activationCode };
};
//activate user
interface IacivationRequest {
  activation_token: string;
  activation_code: string;
}

// Activate a user based on activation token and code
export const activateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { activation_token, activation_code } = req.body as IacivationRequest;
    const newUser: { user: any; activationCode: string } = jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET as string
    ) as { user: any; activationCode: string };
    if (newUser.activationCode != activation_code) {
      return next(new CustomError("invalid activation code", 400));
    }
    const { name, email, password } = newUser.user;
    const existuser = await userModel.findOne({ email });
    if (existuser) {
      return next(new CustomError("Email already Exist", 400));
    } else {
      const user = await userModel.create({
        name,
        email,
        password,
      });
      return res.status(201).json({
        success: true,
        message: "User  successfully created",
      });
    }
  } catch (error: any) {
    console.log(error);
    return next(new CustomError("Invalid or expired activation token", 400));
  }
};

// Define the interface for the login body
interface ILoginBody {
  email: string;
  password: string;
}

// Login user function
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as ILoginBody;
    //if the user not enter the email and password
    if (!email || !password) {
      return next(new CustomError("please enter your email and password", 404));
    }

    // Check if the user with the given email exists
    const user = await userModel.findOne({ email }).select("+password");
    console.log(user, "uset");
    if (!user) {
      return next(new CustomError("Invalid email or password", 400)); // Use CustomError for error handling
    }

    // Compare the provided password with the hashed password stored in the database
    const isPasswordValid = await user.comparePassword(password);
    console.log(isPasswordValid, "blannsn");
    if (!isPasswordValid) {
      return next(new CustomError("Invalid", 400));
    }
    sendToken(user, 200, res);

    // Respond with success message and the access token
    res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error: any) {
    console.log(error);
    return next(new CustomError("Error logging in user", 500)); // Handle unexpected errors
  }
};

// Logout user function
// Logout user function
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Clear the JWT token from cookies
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });

    // Ensure the user ID is a string before passing to Redis
    const userId = req?.user?._id ? req.user._id.toString() : "";

    if (userId) {
      // Use Redis del to remove user session or token
      redis.del(userId, (err, reply) => {
        if (err) {
          console.log("Redis error:", err);
          return next(new CustomError("Error logging out user", 500));
        }
      });
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.log(error);
    return next(new CustomError("Error logging out user", 500)); // Handle unexpected errors
  }
};

// Update access token using the refresh token
export const updateAcessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the refresh token from cookies
    const refresh_token = req.cookies.refresh_token as string;

    if (!refresh_token) {
      return next(new CustomError("Refresh token not found", 404));
    }

    // Verify the refresh token
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as jwt.JwtPayload;
 if(!decoded){
  return next(new CustomError("decoded token not found",404))
 }
 const session=await redis.get(decoded.id as string)
 if(!session){
  return next(new CustomError("session not found",404))
 }
 const user=JSON.parse(session)
 const acessToken=jwt.sign({id:user._id},process.env.ACTIVE_TOKEN as string,{
  expiresIn:"5m",
  
 })
 const refreshToken=jwt.sign({id:user._id},process.env.REFRESH_TOKEN as string,{
  expiresIn:"1d",

 })
    res.cookie("access_token",acessToken,activetokenOptions)
    res.cookie("refresh_token",refreshToken,refreshTokenOptions)
    res.status(200).json({
        success: true,
        acessToken,
       });
 

  } catch (error: any) {
    console.log(error);
    return next(new CustomError("Invalid or expired refresh token", 401)); // Handle invalid token error
  }
};