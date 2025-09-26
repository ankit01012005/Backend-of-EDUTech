const JWT = require("jsonwebtoken")
require("dotenv").config()
const USER = require('../models/User')

//auth

exports.auth = async(req ,res , next)=>{

    try{
        //extraction of token
        const token = req.body.token ||  req.cookies.token || req.header("Authorization").replace(" Bearer" , "")
        console.log((token))
        //validation of token
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Missing Token !"
            })
        }
        console.log(token)

        //verifiaction of token in try catch
        try{
            const decoded = JWT.verify(token,process.env.SECRETE_KEY)
            console.log(decoded)
            req.user = decoded
            
        }catch(error){
            return res.status(401).json({
                success:false,
                message:"Invalid token !"
            })
        }
        next()

    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"Error in authentication"
        })

    }

}


//student
exports.isStudent = async (req , res , next)=>{
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:"This route is protected for Students Only"
            })
        }
        next()

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Error in student authorization"
        })
    }
}

//instructor

exports.isInstructor = async (req , res,next)=>{
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"this is protected route for Instructor Only"
            })
        }
        next()

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Error in Instructor Authorization"
        })
    }
}

//admin

exports.isAdmin = async (req , res,next)=>{
    try{
        console.log(req.user.accountType)
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"this is protected route for Admin Only"
            })
        }
        next()

        }catch(error){
            res.status(500).json({
                success:false,
                message:"Error in Admin Authorization"
            })
        }
}