
//require('dotenv').config({path :"./env"})
import dotenv from 'dotenv';
dotenv.config({ path: './env' });

//import mongoose  from "mongoose";
import { DB_NAME } from "./constants.js";

import connectDB from "./db/index.js";
import { app } from './app.js';


//connectDB()

// 1st approach
/* this approach causing the pollution of index file. 
import express from "express";
const app=express();

//iif
;(async ()=>{

    try {
           
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      

        app.on("error",()=>{
            console.log("Errro: ",error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(` App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("Error: ", error)
        throw error

    }


})();

*/

// 2nd approach
console.log()
connectDB()
.then(()=>{

    // Database connected 
    // to start the server 
    app.listen(process.env.PORT||8000, ()=>{
        //console.log(` server is running at port :${process.env.PORT}`);
        console.log(`⚙️ Server is running at port : ${assignedPort}`);
        
    })
})
.catch((err)=>{

    console.log("MongoDB connection failed !!! ",err)
})


