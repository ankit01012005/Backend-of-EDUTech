const Category = require("../models/Category")

exports.createCategory = async (req ,res)=>{
    try{
        const {name,description} = req.body

        // Validate required fields
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:"Name and description required"
            })
        }

        // Create category in database
        const createdCategory = await Category.create({name:name,description:description})

        res.status(200).json({
            success:true,
            message:"Category created successfully"
        })

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Error in Tag Creation"
        })
    }

}

// Get all categories
exports.showAll_category= async (req , res)=>{
    try{
        const CategoryDetails = await Category.find({},{name:true,description:true})
        res.status(200).json({
            success:true,
            CategoryDetails,
            message:"Categories retrieved successfully"
        })

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Error in geting All Tags Details"
        })
    }
}

// Get category courses, different categories, and top selling courses
exports.getCourseCategory = async (req , res)=>{
    try{
        const categoryId = req.body.categoryId

        // Get category details
        const sameCategoryDetails = await Category.findById(categoryId)
        if(!sameCategoryDetails){
            return res.status(404).json({
                success:false,
                message:"Category not found"
            })
        }

        // Get different categories
        const differentCategDetails = await Category.find({_id:{$ne:categoryId}})

        // Get top 5 selling courses in category (by enrollment count)
        const topSellingCourses = await Category.findById(categoryId)
            .populate({
                path: 'course',
                options: { 
                    sort: { 'studentEnrolled': -1 },
                    limit: 5
                }
            })
            .select('course')
            .exec()

        const topSellingCoursesAggregated = await require("../models/Course").aggregate([
            {$match: { category: require("mongoose").Types.ObjectId(categoryId) }},
            {$addFields: {enrollmentCount: { $size: "$studentEnrolled" }
                }
            },
            {
                $sort: { enrollmentCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    courseName: 1,
                    courseDescription: 1,
                    thumbnail: 1,
                    price: 1,
                    instructor: 1,
                    enrollmentCount: 1,
                    rattingAndReview: 1
                }
            }
        ])
        
        console.log(`Retrieved ${topSellingCoursesAggregated.length} top selling courses`)
    
        return res.status(200).json({
            success:true,
            message:"Got the details",
            data:{
                sameCategoryDetails,
                differentCategDetails,
                topSellingCourses: topSellingCoursesAggregated
            }
        })

    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error in the get same and diff category details"
        })

    }


}