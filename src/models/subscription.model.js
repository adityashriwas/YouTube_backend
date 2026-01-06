import mongoose, {Schema}  from "mongoose";

// mongoose is default export while Schema is named export.
const SubscriptionSchema=new Schema({

    subscriber:{
        type:Schema.Types.ObjectId, //  one who is subscribes to the channel or subscribing 
        ref:"User"
    },

    channel:{
        type:Schema.Types.ObjectId, //  one to whom subscriber is subscribing 
        ref:"User"
    },


},{timestamps:true})








export const Subscription=mongoose.model("Subscription",SubscriptionSchema)






