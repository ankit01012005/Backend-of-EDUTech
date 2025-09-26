const mongoose = require("mongoose")
const { MailSender } = require("../utills/OtpRequired")
const emailTemplate = require("../mail/templates/emailVerification");

const OtpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        trim:true
    },
    otp:{
        type:String,
        required:true,
        trim:true
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:5*60
    }
})

async function emailVerification (email,otp) {
    try{
       
        const mailresponse = await MailSender(email,"Verification mail From StudyNotion",emailTemplate(otp))
        console.log("Email sent Successfully",mailresponse)
    }catch(error){
        console.log("Unsuccussesfull to send mail",error)
        throw error
    }
}

OtpSchema.pre("save", async function(next){

    await emailVerification(this.email,this.otp)
    next()
} )

module.exports = mongoose.model("Otp",OtpSchema)