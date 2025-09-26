const nodemailer = require("nodemailer")
require("dotenv").config()

exports.MailSender = async (email,title,body)=>{
    try{
     const transporter = await nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.Usermail,
            pass:process.env.Userpass
        }
    })
         
    let info = await transporter.sendMail({
        from:"StudyNotion || Love to Study",
        to:email,
        subject:title,
        html:body
    })

    console.log("Mail Sent Success")
    console.log(info)
    return info

   }catch(error){
    console.log("Problem while Mail sending",error)
   }
}