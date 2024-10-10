import express, { NextFunction } from 'express';
import { Request,Response } from 'express';
export const app=express();
const dotenv=require('dotenv')
dotenv.config();
import cors from 'cors';
import cookieparser from 'cookie-parser';
import Userrouter from './routes/userroute';

import { errorHandler, CustomError } from './utils/ErrorHandle';

//body perser
app.use(express.json({ limit: '10mb' })); // Set the limit to 10MB, you can adjust as needed
app.use(cookieparser());
app.use(cors({
    origin: process.env.ORIGIN
  }));
app.use(errorHandler)

app.use('/api/v1',Userrouter)
// Testing route
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      message: "Testing is successful",
      status: "success"
    });
  });
  // Catch-all route for unknown endpoints (404)
app.use('*',(req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
      message: "Route not found",
      status: "fail"
    });
  });
  