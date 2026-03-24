const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true
    },
    lastName:{
        type:String,
        required:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        trim:true
    },
    accountType:{
        type:String,
        enum:["Admin","Student","Instructor"]
    },
    courses:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
        // required:true
    }],
    additionalInfo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Profile",
        // required:true
    },

    //addition added when reset copntroller was being written
    token:{
        type:String
    },
    expiresIn:{
        type:Date
    },
    courseProgress:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"CourseProgress"
    }],
    image:{
        type:String,
        // required:true
    },
    // ============================================================================
    // 🔧 MODIFICATION #2-E: ACCOUNT DELETION SCHEDULING FIELDS
    // Added: Fields to support scheduled account deletion with grace period
    // Date: November 18, 2025
    // Purpose: Allow users to cancel deletion within grace period
    // ============================================================================
    isDeleteScheduled:{
        type:Boolean,
        default:false
    },
    scheduledDeletionDate:{
        type:Date,
        default:null
    }

})

module.exports = mongoose.model("User",userSchema)