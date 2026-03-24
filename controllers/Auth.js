//send Otp 

const USER = require("../models/User")
const OTP = require("../models/Otp")
const OtpGenerator = require("otp-generator");
const { response } = require("express");
const bcrypt = require("bcrypt")
const PROFILE = require("../models/Profile")
const JWT = require("jsonwebtoken");
const { MailSender } = require("../utills/OtpRequired");
const { passwordUpdated } = require("../mail/templates/passwordUpadteMail")
require("dotenv").config()

exports.GenerateOTP = async(req , res)=>{
    try{
        const {email} = req.body;
        const PreUserResistered = await USER.findOne({email})

        if(PreUserResistered){
            return(
                res.status(401).json({
                    success:false,
                    message:"user Already Resistered"
                })
            )
        }
        // Generate OTP
        let otp = OtpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        })

        let result = await OTP.findOne({otp:otp})
        // Ensure unique OTP
        while(result){
            otp = OtpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            })
            result = await OTP.findOne({otp:otp})
        }
        // Store OTP in database
        const otpPayload = {
            email:email,
            otp:otp
        }
        const response = await OTP.create(otpPayload)
        
        // Send OTP email (non-blocking)
        try {
            const otpTemplate = require("../mail/templates/emailVerification");
            const emailBody = otpTemplate(otp);
            await MailSender(email, "OTP Verification for Study Notion", emailBody);
        } catch (emailError) {
            // Log but don't fail OTP generation if email fails
        }
        
        res.status(200).json({
            success:true,
            message:"OTP sent Successfully",
            response
        })
        

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Otp generation internal failure"
        })
        
    }
}


//Sign up

exports.SignUp = async (req ,res)=>{
    try{
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            otp
        } = req.body;

        // Validate required fields
        if(!firstName || !lastName || !email || !password || !otp){
            return res.status(400).json({
                success:false,
                message:"Please Enter the Essential Data Fields"
            })
        }

        // Validate password match
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Password not matched with Confirm Password"
            })
        }

        // Check user already registered
        const existingUser = await USER.findOne({email})
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User Already Registered"
            })
        }

        // Validate OTP
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1)
        if(recentOtp.length == 0){
            return res.status(400).json({
                success:false,
                message:"OTP not found"
            })
        }
        else if(recentOtp[0].otp !== otp){
            return res.status(400).json({
                success:false,
                message:"Invalid OTP"
            })
        }

        // Hash password
        const hashedPass = await bcrypt.hash(password,10)

        // Create user profile
        const profilePayload = {
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null
        }
        const additionalProfile = await PROFILE.create({profilePayload})

        // Create user
        const user = await USER.create({
            firstName:firstName,
            lastName:lastName,
            accountType:accountType,
            email:email,
            password:hashedPass,
            otp:otp,
            additionalInfo:additionalProfile,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })

        return res.status(200).json({
            success:true,
            message:"User created successfully",
            user
        })

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Error in signup"
        })
    }

}

//Login

exports.Login = async (req , res)=>{
    try{
        const {email,password} = req.body

        // Validate required fields
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Email and password required"
            })
        }

        // Find user
        const user = await USER.findOne({email})
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User not found"
            })
        }

        // Verify password and create JWT token
        const checkpass = await bcrypt.compare(password,user.password)
        if(checkpass){
            const payload = {
                email:user.email,
                id:user._id,
                accountType:user.accountType
            }
            const token = await JWT.sign(payload,process.env.SECRETE_KEY,{expiresIn:"2h"})

            const options = {
                expires:new Date(Date.now()+3*24*60*60*1000),
                httpOnly:true,
                secure:true
            }
            res.cookie("token",token,options)
            user.token = token
            user.password = undefined
            res.status(200).json({
                success:true,
                user,
                message:"Login successful"
            })
        }
        else{
            res.status(401).json({
                success:false,
                message:"Incorrect password"
            })
        }
    }catch(error){
        res.status(500).json({
            success:false,
            message:"Login error"
        })
    }

}

//change password

exports.changePassword = async (req , res)=>{
  try{
        const {current_password,new_password,confirm_password} = req.body

        // Validate required fields
        if(!current_password || !new_password || !confirm_password){
            return res.status(400).json({
                success:false,
                message:"All password fields required"
            })
        }

        // Validate new password match
        if(new_password !== confirm_password){
            return res.status(400).json({
                success:false,
                message:"Passwords do not match"
            })
        }

        // Get user and verify current password
        const email = req.user.email
        const user = await USER.findOne({email})
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        if(await bcrypt.compare(current_password,user.password)){
            const updatedUser = await USER.findOneAndUpdate({email:email},
                                                                    {password:new_password},
                                                                    {new:true}
                                                                    )
            // Send confirmation email
            await MailSender(email,"Password Updated",passwordUpdated(
              updatedUser.email,
              `Password updated successfully for ${updatedUser.firstName} ${updatedUser.lastName}`
            ))

            res.status(200).json({
                success:true,
                message:"Password updated successfully"
            })
        }
        else{
            return res.status(401).json({
                success:false,
                message:"Current password incorrect"
            })
        }

  }catch(error){
    res.status(500).json({
        success:false,
        message:"Error changing password"
    })
  }
}