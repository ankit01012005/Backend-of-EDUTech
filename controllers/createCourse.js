const Category = require("../models/Category")
const COURSE = require("../models/Course")
const USER = require("../models/User")
const {imageuploadTo_Cloundinary} = require("../utills/fileUploader")
require("dotenv").config()

//create a course 
exports.createCourse = async (req , res)=>{
    try{
        //get data (coursename , description , what you will learn, price , tag)
        const {courseName,courseDescription,whatyouWillLearn,price,category} = req.body
        
        //thumbnail
        const thumbnail = req.files.thumbnailImage

        //validation
        if(!courseName || !courseDescription || !whatyouWillLearn || !price || !category || !thumbnail){
            return res.status(400).json({
                success:false,
                message:"please fill the required."
            })
        }

        //get instructor details
        const instructor_id = req.user.id
        console.log(instructor_id)

        //TODO:  babbar had fetched the id in DB to get instructor 
        // Object id which could be same so no need to fetch agaian

        //validate instructor

        //get tag details
        //validate tags details
        const categoryDetails = await Category.findById(category)
        if(!categoryDetails){
            return res.status(404).json({
                success:false,
                message:"Course Category not found, retry"
            })
        }
        console.log(categoryDetails)

        //upload to cloudinary
        const uploadedFile = await imageuploadTo_Cloundinary(thumbnail,process.env.FOLDER_NAME)
        console.log(uploadedFile)
        //create the course
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
                console.log(createdCourse)

        //update the user for the updated course add

        const updatedUser = await USER.findByIdAndUpdate({_id:instructor_id},
                                                            {
                                                                courses:createdCourse._id
                                                            },
                                                            {new:true}
        )
        //return response
        return res.status(200).json({
            success:true,
            message:"Course created Successfully",
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