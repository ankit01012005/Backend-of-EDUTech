//payment controller
const COURSE = require("../models/Course")
const USER = require("../models/User")
const {instance} = require("../config/razorpay")
const MailSender = require("../utills/OtpRequired")
const { default: mongoose } = require("mongoose")

//capture the payment
exports.capturePayment = async (req , res)=>{
    try{
        //get the userId  and courseId
        const courseId = req.body
        const userId = req.user.id
        //validation
        if(!courseId){
            return res.json({
                success:false,
                message:"Invalid course ID"
            })
        }
        let courseDetails
        try{
            courseDetails = await COURSE.findById(courseId)
            //course details validation
            if(!courseDetails){
                return res.status(404).json({
                    success:false,
                    message:"Course not Found"
                })
            }
            //check wether previosly enrolled user
            const uid = mongoose.Types.ObjectId(userId)
            if(courseDetails.studentEnrolled.includes(uid)){
                return res.status(200).json({
                    success:false,
                    message:"Student already Enrolled in the course"
                })
            }

        }catch(error){
            console.log(error)
             res.status(500).json({
                success:false,
                message:"Error in course details and user existance DB call"
            })

        }

        //order create 
        const amount=courseDetails.price
        const currency = "INR"
        const options = {
            amount:amount*100,
            currency,
            receipt:Math.random(Date.now()).toString(),
            notes:{
                course_Id:courseId,
                user_Id:userId
            }
        }
        const paymentResponse = await instance.orders.create(options)
                                        .then(()=>{
                                            console.log("Order created successfully")
                                        })
                                        .catch((error)=>{
                                            console.log(error)
                                            console.log("error in oder creattion ")
                                        })

        //return response
        return res.status(200).json({
            success:true,
            message:"payment creation initiated",
            courseName:courseDetails.courseName,
            courseDescription:courseDetails.courseDescription,
            thumbnail:courseDetails.thumbnail,
            orderId:paymentResponse.id,
            currency,
            amount    
        })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error in payment with razorPay"
        })
    }
        

}

//authorize the payment by verifing the server key and razorPay key

exports.authorizePayment = async (req , res)=>{
    const serverWebhook = "123456789"
    const razorSecret = req.header["x-razorpay-signature"]

    //encryption of the serverWebhook
    const shashum = crypto.createHmac("sha256",serverWebhook)
    shashum.update(JSON.stringify(req.body))
    const digest = shashum.digest("hex")

    //got the encrypted formate of serverhook
    if(razorSecret === digest){
        //get the courseId and userId
        const {userId , courseId} = req.body.payload.payment.entity.notes

        //update to courese enrollement array
        try{
            //update to the user courses
            const updatedCourse = await COURSE.findOneAndUpdate(
                                                    {_id:courseId},
                                                    {$push:{studentEnrolled:userId}},
                                                    {new:true}
                                                )
            console.log(updatedCourse)
            if(!updatedCourse){
                return res.json({
                    success:false,
                    message:"Course not found"
                })
            }
            const updatedUser = await USER.findOneAndUpdate(
                                                {_id:userId},
                                                {$push:{courses:courseId}},
                                                {new:true}
                                            )
            console.log(updatedUser)

            //send the mail to user
            await MailSender(
                updatedUser.email,
                "Confirmation of Course Enrollement",
                "Congratulations You have be enrolled in new Course "
            )
            //return res.response
            return res.status(200).json({
                success:true,
                updatedCourse,
                updatedUser,
                message:"signature Verified and student enrollement done"
            })
        }catch(error){
            console.log(error)
            return res.status(500).json({
                success:false,
                message:"Message while enrollemnet course"
            })

        }    
    }
    else{
        return res.status(400).json({
            success:false,
            message:"Inavlid sugnature"
        })
    }
}