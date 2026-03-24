const JWT = require("jsonwebtoken")
require("dotenv").config()
const USER = require('../models/User')

exports.auth = async(req ,res , next)=>{
    try{
        // Extraction of token (body, cookie, or Authorization header)
        const authHeader = req.header("Authorization") || ""
        const headerToken = authHeader.replace(/^Bearer\s+/i, "")
        const token = req.body?.token || (req.cookies && req.cookies.token) || headerToken

        // Validation of token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token missing"
            })
        }

        // Verification of token
        try{
            const decoded = JWT.verify(token,process.env.SECRETE_KEY)
            req.user = decoded
        }catch(error){
            return res.status(401).json({
                success:false,
                message:"Invalid token"
            })
        }
        next()

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Authentication error"
        })
    }
}
exports.isStudent = async (req , res , next)=>{
    try{
        if(req.user.accountType !== "Student"){
            return res.status(403).json({
                success:false,
                message:"This route is protected for students only"
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
            return res.status(403).json({
                success:false,
                message:"This route is protected for instructors only"
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

        if(req.user.accountType !== "Admin"){
            return res.status(403).json({
                success:false,
                message:"This route is protected for admins only"
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