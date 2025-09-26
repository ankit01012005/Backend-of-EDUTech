const RATTING_AND_REVIEW = require("../models/RattingAndReviews")
const COURSE = require("../models/Course")
const USER = require("../models/User")
const { default: mongoose } = require("mongoose")

//create ratting and review
exports.createRatting = async (req , res)=>{
    try{
        //get user id
        const userId = req.user.id

        //get all details from body
        const {ratting , review , courseId} = req.body

        //check if user is already enrolled or not 
        const EnrolledUser = await COURSE.findOne(
                                            {
                                                _id:courseId,
                                                studentEnrolled:{$elemMatch:{$eq:userId}},

                                            }
                                        )
        if(!EnrolledUser){
            return res.status(404).json({
                success:false,
                message:"User not enrolled in course"
            })
        }

        //check if user already ratted or not
        const alreadyRatted = await RATTING_AND_REVIEW.findOne(
                                                                {
                                                                    course:courseId,
                                                                    user:userId
                                                                }
                                                            )
        if(alreadyRatted){
            return res.json({
                sucess:false,
                message:"User already Ratted the course"
            })
        }

        //create a ratting
        const create_ratting = await RATTING_AND_REVIEW.create({
                                                                    course:courseId,
                                                                    user:userId,
                                                                    ratting,
                                                                    review
                                                                })

        //update at the course
        const updatedCourse = await COURSE.findByIdAndUpdate(
                                                                {
                                                                    _id:courseId
                                                                },
                                                                {$push:{
                                                                    rattingAndReview:create_ratting._id
                                                                }},
                                                                {new:true}
                                                            )
        //return resposne
        return res.status(200).json({
            success:true,
            message:"Ratting given to course successfully",
            create_ratting,
            updatedCourse
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Error while creating ratting and review"
        })

    }
}

//get average ratting

exports.averageRating = async (req , res)=>{
   try{
        //get the id
        const courseId = req.body.courseId
        //calculate the agregate function
        const result = await RATTING_AND_REVIEW.aggregate([
            {
                $match:{
                    course: mongoose.Types.ObjectId(courseId)
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating:{$avg:"$ratting"}
                }
            }
        ])
        if(result.length>0){
            return res.status(200).json({
                success:true,
                message:"Average ratting",
                averageRating:result[0].averageRating
            })
        }
        return res.status(200).json({
            success:true,
            message:"Average ratting",
            averageRating:0
        })

   }catch(error){
        return res.status(500).json({
                success:false,
                message:"Error while getting average ratting"
            })
   }


}
//get all ratting

exports.getAllratingAndreviews = async (req , res)=>{
    try{
        const Allrating = await RATTING_AND_REVIEW.find({})
                                                        .sort({ratting:"desc"})
                                                        .populate({
                                                            path:"user",
                                                            select:"firstName lastName email image "
                                                        })
                                                        .populate({
                                                            path:"course",
                                                            select:"courseName"
                                                        })
                                                        .exec()
        return res.status(200).json({
            success:true,
            message:"Got all the ratting and reviews successfully",
            Allrating
        })

    }catch(error){
        return res.status(500).json({
                success:false,
                message:"Error while getting all ratting and reviews"
            })

    }
}