import {Redis} from 'ioredis'
const dotenv=require("dotenv");
dotenv.config();
 const redisclient=()=>{
    if(process.env.REDIS_URL){
        console.log("Redis connected")
        return process.env.REDIS_URL
    }
    throw new Error("redis connection failed")
 }
export const redis=new Redis(redisclient())