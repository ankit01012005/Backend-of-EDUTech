const nodemailer = require("nodemailer")
require("dotenv").config()

exports.MailSender = async (email,title,body)=>{
    try{
        console.log("Mail credentials check:");
        console.log("Email:", process.env.Usermail);
        console.log("Pass exists:", !!process.env.Userpass);
        
        if (!process.env.Usermail || !process.env.Userpass) {
            throw new Error("Email credentials not found in .env file");
        }
        
        const transporter = await nodemailer.createTransport({
            service:"gmail",
            auth:{
                user: process.env.Usermail,
                pass: process.env.Userpass
            }
        })
        
        console.log("Transporter created successfully");
         
        let info = await transporter.sendMail({
            from: "StudyNotion <" + process.env.Usermail + ">",
            to: email,
            subject: title,
            html: body
        })

        console.log("Mail Sent Success");
        console.log("Message ID:", info.messageId);
        return info;

    } catch(error){
        console.log("Problem while Mail sending:", error.message);
        console.log("Full error:", error);
        throw error;
    }
}