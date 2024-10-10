import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the MongoDB URI from the environment variables
const MONGO_URI: string = process.env.MONGO_URL || '';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI).then((data: any) => {
      console.log(`Database connection successful: ${process.env.MONGO_URL}`);
    });
  } catch (error:any) {
    console.error(`Error connecting to the database: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
}

export default connectDB;
