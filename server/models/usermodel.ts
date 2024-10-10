import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
const dotenv = require("dotenv");
dotenv.config();
import jwt from "jsonwebtoken";
 export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  _id: Types.ObjectId;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword(enteredPassword: string): Promise<boolean>;
  SignAcessToken: () => string;
  SignRefreshToken: () => string;
}

// Email regex for validation
const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Hide password by default in queries
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Hash Password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.signAccessToken = async function () {
  try {
    const activetoken = await jwt.sign(
      { id: this._id }, // Payload (data)
      process.env.ACTIVE_TOKEN || "", // Secret key
      { expiresIn: "5m" } // Token expiration (optional)
    );
    return activetoken;
  } catch (err) {
    throw new Error("Error signing the access token");
  }
};
userSchema.methods.signRefreshToken = async function () {
  try {
    const refreshtoken = await jwt.sign(
      { id: this._id }, // Payload (data)
      process.env.REFRESH_TOKEN || "", // Secret key
      { expiresIn: "3h" } // Token expiration (optional)
    );
    return refreshtoken;
  } catch (err) {
    throw new Error("Error signing the refresh token");
  }
};

// Compare Password method
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  console.log(enteredPassword,"enterpassword")
  console.log(this.password,"hashpassword")
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default userModel;
