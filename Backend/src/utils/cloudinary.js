import {v2 as cloudinary} from "cloudinary";

import fs from "fs";


 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});



const uploadOnCloudinary = async(localFilePath)=>{

    try{

        if(!localFilePath) return null
        // uplaod the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        // file uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch(error){

        // file is in our server so problem is in upload. 
        // remove  the file from server 
        fs.unlinkSync(localFilePath)
        return null
    }

}


export {uploadOnCloudinary}
