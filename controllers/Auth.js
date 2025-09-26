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
        //generate otp
        //for new user
        let otp = OtpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        })

        let result = await OTP.findOne({otp:otp})
        //generation of uniqueq otp

        while(result){
            otp = OtpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            })
            result = await OTP.findOne({otp:otp})
        }
        //got the unique otp , it is bad practice company will provide unique otp generator 
        //create a db of otp
        const otpPayload = {
            email:email,
            otp:otp
        }
        const response = await OTP.create(otpPayload)
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

//data fetch  from request ki body
    try{
                const {
                    firstName,
                    lastName,
                    email,
                    password,
                    confirmPassword,
                    accountType,
                    // mobileNumber,
                    otp
                } = req.body;


        //validate the data

        if(!firstName || !lastName || !email || !password || !otp){
            return res.status(400).json({
                success:false,
                message:"Please Enter the Essential Data Fields"
            })
        }
        console.log(firstName)
        console.log(password)
        console.log(confirmPassword)

        //2 password validation

        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Password not matched with Confirm Password"
            })
        }
        console.log("check before user exitace")
        //check user already resistered or not

        const existingUser = await USER.findOne({email})
        if(existingUser){
            return res.status(400).json({
                success:true,
                message:"Already Resistered User"
            })
        }
         console.log("check after user exitace")
        //find the recent otp
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1)
        console.log("check after otp  finding")
        //validate the otp
        if(recentOtp.length == 0){
            return res.status(400).json({
                success:false,
                message:"Otp not found in DB"
            })

        }
        else if(recentOtp[0].otp !== otp){
            console.log(recentOtp.otp)
            console.log(otp)
            return res.status(400).json({
                success:false,
                message:"Wrong OTP"
            })
        }


        //hash the password 

        const hashedPass = await bcrypt.hash(password,10)

        //create additional profile by Profile model
        //gender dateOfBirth about constactNumber
        const profilePayload = {
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null
        }
        console.log("check before profile  ceration")
        const additionalProfile = await PROFILE.create({profilePayload})
         console.log("check after profile  ceration")

        //save in the entry 

        const user = await USER.create({
            firstName:firstName,
            lastName:lastName,
            accountType:accountType,
            // mobileNumber,
            email:email,
            password:hashedPass,
            otp:otp,
            additionalInfo:additionalProfile,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })
        console.log("check after user  ceration")

        return res.status(200).json({
            success:true,
            message:"User created Successfully.",
            user
        })

    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"Internal error in SignUp"
        })

    }

}

//Login

exports.Login = async (req , res)=>{
    try{
        //get the data

        const {email,password} = req.body

        //validate the data
        
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Please fill the Required details"
            })
        }

        //user existance
        const user = await USER.findOne({email})

        if(!user){
            return res.status(401).json({
                success:false,
                message:"User not found"
            })
        }

        //match pass if true then create jwt token and send cookie

        const checkpass = await bcrypt.compare(password,user.password)
        if(checkpass){
            payload = {
                email:user.email,
                id:user._id,
                accountType:user.accountType
            }
            const token = await JWT.sign(payload,process.env.SECRETE_KEY,{expiresIn:"2h"})

            const options = {
                expires:new Date(Date.now()+3*24*60*60*1000),
                httpOnly:true,
                secure:true,
               // sameSite:'strict'
            }
            res.cookie("token",token,options)
            //user ko to_object karna hota h kya
            user.token = token
            user.password = undefined
            res.status(200).json({
                success:true,
                user,
                message:"Login Successfull"
            })
        }
        else{
            res.status(401).json({
                success:false,
                message:"Incorrect Paasword !"
            })
        }
    }catch(error){
        console.error(error)
        res.status(500).json({
            success:false,
            message:"Error while Login , Please try again"
        })

    }

}

//change password

exports.changePassword = async (req , res)=>{
  try{
        //get data
        const {current_password,new_password,confirm_password} = req.body
        // current pass , new pass , confirm pass
        //validate
        if(!current_password || !new_password || !confirm_password){
            return res.json({
                success:false,
                message:"please fill the required details first."
            })
        }
        if(!new_password !== !confirm_password){
            return res.json({
                success:false,
                message:"Confirm password does't matched."
            })
        }
        //update
        const email = req.user.email
        const user = await USER.findOne({email})
        if(!user){
            return res.json({
                success:false,
                message:"User not found in DB"
            })
        }
        if(await bcrypt.compare(current_password,user.password)){
            const updatedUser = await USER.findOneAndUpdate({email:email},
                                                                    {
                                                                        password:new_password
                                                                    },
                                                                    {new:true}
                                                                    )
        }
        else{
            return res.json({
                success:false,
                message:"wrong Password"
            })
        }
        //send mail
        await MailSender(email,"Updated Password",passwordUpdated(
          updatedUser.email,
          `Password updated successfully for ${updatedUser.firstName} ${updatedUser.lastName}`
        ))

        //return respsponse
        res.status(200).json({
            success:true,
            message:"Updated password and mail send successfully"
        })

  }catch(error){
    console.log(error)
    res.status(500).json({
        success:false,
        message:"Error while changing password and sending mail"
    })

  }
}