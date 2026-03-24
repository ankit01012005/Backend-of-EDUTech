const Category = require("../models/Category")
const COURSE = require("../models/Course")
const USER = require("../models/User")
const {imageuploadTo_Cloundinary} = require("../utills/fileUploader")
require("dotenv").config()

// Create course (instructor only)
exports.createCourse = async (req , res)=>{
    try{
        const {courseName,courseDescription,whatyouWillLearn,price,category} = req.body
        const thumbnail = req.files.thumbnailImage

        // Validate required fields
        if(!courseName || !courseDescription || !whatyouWillLearn || !price || !category || !thumbnail){
            return res.status(400).json({
                success:false,
                message:"All fields required"
            })
        }

        // Verify instructor authorization
        const instructor_id = req.user.id
        const instructorDetails = await USER.findById(instructor_id)
        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            })
        }
        if (instructorDetails.accountType !== "Instructor") {
            return res.status(403).json({
                success: false,
                message: "Only instructors can create courses"
            })
        }

        // Validate category
        const categoryDetails = await Category.findById(category)
        if(!categoryDetails){
            return res.status(404).json({
                success:false,
                message:"Category not found"
            })
        }

        // Upload thumbnail to Cloudinary
        const uploadedFile = await imageuploadTo_Cloundinary(thumbnail,process.env.FOLDER_NAME)

        // Create course
        const createdCourse = await COURSE.create({  
                    courseName: courseName,
                    courseDescription: courseDescription,
                    instructor: instructor_id,
                    price: price,
                    thumbnail: uploadedFile.secure_url,
                    whatyouWillLearn: whatyouWillLearn,
                    category:categoryDetails._id,
                    courseContent:[],
                    rattingAndReview:null,
                    studentEnrolled:null
                })

        // Update instructor's courses list
        const updatedUser = await USER.findByIdAndUpdate({_id:instructor_id},
                                                            {courses:createdCourse._id},
                                                            {new:true}
        )

        return res.status(200).json({
            success:true,
            message:"Course created successfully",
            updatedUser
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"error while creating course"
        })
    }
}

//get all course details
exports.getAllCourses = async (req , res)=>{
    try{
        const courseDetails = await COURSE.find({},
                                                    {
                                                        courseName:true,
                                                        courseDescription:true,
                                                        price:true,
                                                        thumbnail:true,
                                                        instructor:true,
                                                        rattingAndReview:true,
                                                        studentEnrolled:true,
                                                    }
                                                ).populate("instructor")
                                                    .exec(1)
        return res.status(200).json({
            success:true,
            courseDetails,
            message:"Your the all course"
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"ERROR in get all course data"
        })
    }
}

//get course all details

exports.getCourseDetails = async (req , res)=>{
    try{
        //get the course id
        const courseObeject = req.body
        const courseId = courseObeject.courseId
        console.log(courseId)
    
        //find in course DB and give all exact data using populate
        const courseDetails = await COURSE.findById(courseId)
                                                    .populate({
                                                        path:"instructor",
                                                        populate:{
                                                            path:"additionalInfo"
                                                        }
                                                    })
                                                    .populate("category")
                                                    .populate("rattingAndReview")
                                                    .populate({
                                                        path:"courseContent",
                                                        populate:{
                                                            path:"Subsections"
                                                        }
                                                    })

        //validate course
        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:`course not found with the CourseId : ${courseId}`
            })
        }

        //return resposne
        return res.status(200).json({
            success:true,
            message:"Got the details",
            courseDetails
        })

    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error while get course details"
        })

    }
}