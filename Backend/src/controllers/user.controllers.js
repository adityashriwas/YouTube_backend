import { asyncHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";

import {uploadOnCloudinary} from "../utils/cloudinary.js"

import { ApiResponce } from "../utils/ApiResponce.js";

import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefershTokens= async(userId)=>{

    try{

        const user=await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken

        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

    }
    catch(error){

        throw new ApiError(500,"something went wrong while generating refresh and access token")
    }


}

const registerUser=asyncHandler(async (req,res)=>{

    

    const {fullName,email,username,password}=req.body
    console.log("email: ",email)
    console.log("password: ",password)

    // if (fullName===""){
    //     throw new ApiError(400,"fullname is required")
    // }

    if(
        [fullName,email,username,password].some((field)=>{
            
          if( field===undefined || field===null || field.toString().trim()==="")
          {
            return true
          }
          
              
        })
    ) 
    {
        throw new ApiError(400,"All fields are is required")
        
    }

    // check if user id alredy exists or not. 
    // based on email or name


    const existedUser= await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

    console.log(req.files)

    const avatarLocalPath=req.files?.avatar[0]?.path; 
    console.log(avatarLocalPath)
    
    // const coverImageLocalPath=req.files?.coverImage[0]?.path
    // console.log(coverImageLocalPath)

    // getting the error in optinal channing. 
    // trying  to read coverImage which is undefiend its fist  value. 
    // i.e can not read properties of undefiend 

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0 ){
         coverImageLocalPath=req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    console.log(avatar)

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    console.log(coverImage)
    
    if (!avatar){
        throw new ApiError(400,"Avatar file is requireds")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
        refreshToken:null

    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        throw new ApiError(500, "something went wrong while registering a user")
    }


    return res.status(201).json( 
        new ApiResponce(201,createdUser,"User registerd succesfully")
    )



    
    // res.status(200).json({
    //     message:"ok"
    // })


})


const loginUser=asyncHandler(async(req,res)=>{
     
    const {email,username,password}=req.body

    console.log(email)
    console.log(username)
    console.log(password)


    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    console.log(user)

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    // console.log(isPasswordValid)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }


    // creating access and refresh token
    const {accessToken,refreshToken} = await generateAccessAndRefershTokens(user._id)

    
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")


    // setting the cookies to client browse
    // to send access and refresh token 

    //By default cookies are modifiable by the client.  
    // httpOnly prevent that. 
    // only the server can modify this cookie  

    const options={

        httpOnly:true,
        secure:true
    }

    // setting the cookies to client browse
    // to send access and refresh token 
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponce(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            
            "user logged in Successfully"
        )
    )

 
})


const logoutUser=asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set:{
            //     refreshToken:undefined
            // }
            $unset:{
                refreshToken:1
            }
        },
        // this will give new updated  value with refreshToken undefined. 
        {
            new:true
        }
    )

    const options={

        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponce(200,{},"User logged Out"))

    
})


const refreshAccessToken=asyncHandler(async(req,res)=>{

   const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401,"unauthrized request")
   }

   try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
    const user=await User.findById(decodedToken?._id)
 
    if(!user){
         throw new ApiError(401,"Invalid Refresh Token")
    }
 
    if(incomingRefreshToken !==user?.refreshToken){
 
     throw new ApiError(401,"Refresh token is expired or used")
 
    }
 
     const options={
         httpOnly:true,
         secure:true
     }
 
     const {accessToken,newRefreshToken}=await generateAccessAndRefershTokens(user._id)
 
     return res.status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(
         new ApiResponce(200,{accessToken,newRefreshToken},"Access token refreshed successfully")
     )

   } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token ")

   }


})




const changeCurrentPassword= asyncHandler(async(req,res)=>{

    const {currentPassword,newPassword}=req.body

    if(!currentPassword || !newPassword){
        throw new ApiError(400,"All fields are required")
    }

    const user=await User.findById(req.user?._id).select("+password")

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid= await user.isPasswordCorrect(currentPassword)
                                        

    if(!isPasswordValid){
        throw new ApiError(400,"Invalid password")
    }


    user.password=newPassword
    await user.save({validateBeforeSave:false})


    return res
    .status(200)
    .json(new ApiResponce(200,{},"password changed successfully"))
    
})


const getCurrentUser=asyncHandler(async(req,res)=>{

    return res
    .status(200)
    .json(new ApiResponce(200,req.user,"Current user fetched successfully"))

})

const updateAccountDetails=asyncHandler(async(req,res)=>{

    const {fullName,email}=req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            // mongo db operators $set, $inc, $push, $pull, $unset
            $set: {
                fullName:fullName,
                email:email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponce(200,user,"Account details updated successfully"))
    
})



const updateUserAvatar=asyncHandler(async(req,res)=>{

    const avatarLocalPath=req.file?.path

    if (!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error in uploading avatar")
    }

    const user=  await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.
    status(200).
    json( new ApiResponce(200,user,"Avatar updated successfully"))

})


const updateUserCoverImage=asyncHandler(async(req,res)=>{

    const coverImageLocalPath=req.file?.path

    if (!coverImageLocalPath){
        throw new ApiError(400,"CoverImage file is required")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error in uploading coverImage")
    }

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(2000)
    .json(new ApiResponce(200,user,"CoverImage updated successfully"))

})



const  getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")
    }

    const channel=await User.aggregate([
        {

            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }


        },
        {
            $addFields:{
                subscribersCount:{$size:"$subscribers"},
                subscribedToCount:{$size:"$subscribedTo"},
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }

                }
            }


        },
        {
            $project:{
                fullName:1,
                username:1,
                email:1,
                avatar:1,
                coverImage:1,
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1

            }
        }
        
        
        
    ])
    console.log(channel)

    if(!channel || channel.length===0){
        throw new ApiError(404,"Channel does not exist")
    }


    return res.status(200)
    .json(new ApiResponce(200,channel[0],"Channel fetched successfully"))


})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
        
                        }
        
                    },
                    {
                        $addFields:{
                            owner:{$arrayElemAt:["$owner",0]}
                        }
                    }
                ]
            },

        
        }
        
    ])


    console.log(user)
    return res.status(200)
    .json(new ApiResponce(200,user[0]?.watchHistory,"Watch history fetched successfully"))
    
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}




