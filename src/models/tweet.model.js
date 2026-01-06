import mongoose from "mongoose";
import { Schema } from "mongoose";

const tweetSchema = new Schema({

    content: {
        type: String,
        required: true,
        default: ""
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },



}, { timestamps: true });

export const Tweet = mongoose.model("Tweet", tweetSchema);
