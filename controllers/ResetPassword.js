const USER = require("../models/User")
const {MailSender} = require("../utills/OtpRequired")
const bcrypt = require("bcrypt")
const crypto = require("crypto")

//Reset password 
//1. part sending mail for ui of updating pwd

exports.resetPasswordToken = async (req , res)=>{

    try{
        //fetch email 
        const email = req.body.email 

        //validate and verify mail
        if(!email){
            return res.json({
                success:false,
                message:"Enter the mail first"
            })
        }

        const user = await USER.findOne({email})
        if(!user){
            return res.json({
                success:false,
                message:"Mail not resistered with us"
            })
        }
        console.log(user)

        //generate specifics link token
        const token = crypto.randomUUID()
        //update token and expires time  in user model
        const updatedUser = await USER.findOneAndUpdate({email:email},
                                                            {
                                                                token:token,
                                                                expiresIn:Date.now()+5*60*1000
                                                            },
                                                            {
                                                                new:true
                                                            }
                                                        )
        //create URL
        const URL = `http://localhost:3000/update-password${token}`

        //send mail
        await MailSender(email,"Reset Password Link",`Link  : ${URL}`)

        //return response
        res.status(200).json({

            success:true,
            message:"Reset pass link sent to Email"
        })
       
    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"Error while Reset pass mail sending"
        })
    }
}

//2. updating the pwd in db

exports.resetPassword = async (req , res)=>{
    try{
        //fetch data
        const {password,cfrm_password,token} = req.body

        //validation of data
        if(!password || !cfrm_password){
            return res.json({
                success:false,
                message:"fill the required details"
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
