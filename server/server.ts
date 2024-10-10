import { app } from "./app";
const dotenv =require('dotenv')
import connectDB from "./utils/db";
dotenv.config();

connectDB();

//create the server
app.listen(process.env.PORT,()=>{
    console.log(`server is listing in port ${process.env.PORT}`)
    
})
