import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: "/.env"
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.error("MONGODB Connection failed!!! ", error);
    process.exit(1);
})




/*
import express from "express";
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error)=>{
            console.log("ERRR: ", error);
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port ${process.env.PORT}`);            
        })

    } catch (error) {
        console.error("ERROR: ", error);
        throw error;
    }
} )()
*/