const USER = require("../models/User")
const {MailSender} = require("../utills/OtpRequired")
const bcrypt = require("bcrypt")
const crypto = require("crypto")

// Generate reset password token and send email
exports.resetPasswordToken = async (req , res)=>{
    try{
        const email = req.body.email 

        // Validate email
        if(!email){
            return res.status(400).json({
                success:false,
                message:"Email required"
            })
        }

        // Verify user exists
        const user = await USER.findOne({email})
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        // Generate reset token
        const token = crypto.randomUUID()
        
        // Update user with token and expiration
        const updatedUser = await USER.findOneAndUpdate({email:email},
                                                            {
                                                                token:token,
                                                                expiresIn:Date.now()+5*60*1000
                                                            },
                                                            {new:true}
        )

        // Generate reset URL
        const URL = `http://localhost:3000/update-password/${token}`

        // Send reset link via email
        await MailSender(email,"Reset Password Link",`Reset Link: ${URL}`)

        res.status(200).json({
            success:true,
            message:"Reset link sent to email"
        })
       
    }catch(error){
        res.status(500).json({
            success:false,
            message:"Error sending reset link"
        })
    }
}

// Update password with reset token

exports.resetPassword = async (req , res)=>{
    try{
        const {password,cfrm_password,token} = req.body

        // Validate password fields
        if(!password || !cfrm_password){
            return res.status(400).json({
                success:false,
                message:"Password fields required"
            })
        }
        if(password !== cfrm_password){
            return res.json({
                success:false,
                message:"confirm password doesn't matched."
            })
        }
        //get userdetails from the token
        const user = await USER.findOne({token})

        //if !user Invalid token
        if(!user){
            return res.json({
                success:false,
                message:"INVALID RESET Link"
            })
        }

        //check for token expiry
        if(Date.now() > user.expiresIn){
            return res.json({
                success:false,
                message:"Reset link has been Expired"
            })
        }
        //hash the pass
        try{
            const hasedPwd = await bcrypt.hash(password,10)
        }catch(error){
            console.log(error)
            return res.json({
                success:false,
                message:"error while hashing password"
            })
        }
        //update the pass
        const updatedUser = await USER.findOneAndUpdate({token:token},
                                                            {
                                                                password:hasedPwd
                                                            },
                                                            {new:true}
                                                        )
        //return res
        res.status(200).json({
            success:true,
            message:"Password updated Successfully"
        })

    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"Error while Updating pass in DB"
        })
    }
}
