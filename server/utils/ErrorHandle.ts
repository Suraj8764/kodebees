import { Request, Response, NextFunction } from 'express';
const dotenv=require("dotenv");
dotenv.config();
// Custom Error class to handle different error statuses
class CustomError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handling middleware
const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the error stack in development mode
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
    });
};


export { errorHandler,  CustomError };
