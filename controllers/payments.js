//payment controller
const COURSE = require("../models/Course")
const USER = require("../models/User")
const {instance} = require("../config/razorpay")
const MailSender = require("../utills/OtpRequired")
const { default: mongoose } = require("mongoose")
const crypto = require("crypto") // 🔧 MODIFICATION #5-A: Added crypto for signature verification

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
    // ============================================================================
    // 🔧 MODIFICATION #5-B: COMPLETE RAZORPAY SIGNATURE VERIFICATION
    // Added: Proper HMAC-SHA256 signature verification from Razorpay
    // Date: November 18, 2025
    // Purpose: Verify webhook authenticity and prevent unauthorized payments
    // Security: Uses your Razorpay key_secret for signature validation
    // ============================================================================
    try {
        // Get the Razorpay signature from request headers
        const razorpaySignature = req.headers["x-razorpay-signature"]
        
        if (!razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: "Missing Razorpay signature in headers"
            })
        }

        // Get your Razorpay API secret from environment
        const razorpaySecret = process.env.YOUR_KEY_SECRET
        if (!razorpaySecret) {
            console.error("RAZORPAY_KEY_SECRET not found in environment variables")
            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            })
        }

        // Create HMAC-SHA256 signature of the request body
        const body = JSON.stringify(req.body)
        const expectedSignature = crypto
            .createHmac("sha256", razorpaySecret)
            .update(body)
            .digest("hex")

        console.log("Expected Signature:", expectedSignature)
        console.log("Received Signature:", razorpaySignature)

        // Verify signatures match
        if (razorpaySignature !== expectedSignature) {
            console.log("Signature verification failed!")
            return res.status(403).json({
                success: false,
                message: "Invalid signature - payment verification failed"
            })
        }

        console.log("✅ Signature verified successfully!")

        // Extract payment details from request body
        const { payment_id, order_id } = req.body.payload.payment.entity
        const { course_Id: courseId, user_Id: userId } = req.body.payload.payment.entity.notes
        
        // Additional validations
        if (!courseId || !userId || !payment_id) {
            return res.status(400).json({
                success: false,
                message: "Missing required payment information"
            })
        }

        // Verify course exists
        const course = await COURSE.findById(courseId)
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }

        // Verify user exists
        const user = await USER.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // Check if user is already enrolled
        if (course.studentEnrolled && course.studentEnrolled.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "Student already enrolled in this course"
            })
        }

        // Enroll student in course
        try {
            // Update course with new student enrollment
            const updatedCourse = await COURSE.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentEnrolled: userId } },
                { new: true }
            ).populate("instructor")
            .populate("category")
            .exec()

            // Update user with new course enrollment
            const updatedUser = await USER.findOneAndUpdate(
                { _id: userId },
                { $push: { courses: courseId } },
                { new: true }
            )

            // Send enrollment confirmation email
            try {
                await MailSender(
                    updatedUser.email,
                    "Course Enrollment Confirmation",
                    `Congratulations! You have been successfully enrolled in the course: ${course.courseName}. 
                    Access your course from your dashboard.`
                )
            } catch (emailError) {
                console.log("Warning: Email sending failed, but enrollment completed:", emailError)
            }

            return res.status(200).json({
                success: true,
                message: "Signature Verified and student enrollment completed successfully",
                data: {
                    courseId,
                    courseName: course.courseName,
                    userId,
                    paymentId: payment_id,
                    orderId: order_id,
                    enrollmentTimestamp: new Date().toISOString()
                }
            })

        } catch (enrollmentError) {
            console.log("Error during enrollment:", enrollmentError)
            return res.status(500).json({
                success: false,
                message: "Payment verified but enrollment failed"
            })
        }

    } catch (error) {
        console.log("Error in payment authorization:", error)
        return res.status(500).json({
            success: false,
            message: "Error in payment verification"
        })
    }
}