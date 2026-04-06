import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async()=>{

    try {

        console.log('PORT:', process.env.PORT);
        console.log('MONGODB_URI:', process.env.MONGODB_URI);
        console.log('DB_NAME:', process.env.DB_NAME);

      const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

      console.log(connectionInstance);
      

      console.log(`\n MongoDB connected !! DB HOST:${connectionInstance.connection.host}`);
      

    } catch (error) {
        console.log("MONGODB connection error ",error);
        //throw error;
        // process.exit(number) specify why we are exiting our appliation. 
        // exit kill the currenct process where our application is running.  
        process.exit(1) 
        
    }

}


export default connectDB;

 