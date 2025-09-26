const Category = require("../models/Category")

exports.createCategory = async (req ,res)=>{
    try{
        //get name and description
        const {name,description} = req.body

        //validate it 
        if(!name || !description){
            return res.json({
                success:false,
                message:"Please fill required details"
            })
        }
        console.log("before category creation")
        //create entry in db
        const createdCategory = await Category.create({name:name,description:description})
        //return response
        console.log("after category creation")
        res.status(200).json({
            success:true,
            message:"Tag created successfully"
        })

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Error in Tag Creation"
        })
    }

}

//get all tags details

exports.showAll_category= async (req , res)=>{
    try{
        const CategoryDetails = await Category.find({},{name:true,description:true})
        res.status(200).json({
            success:true,
            CategoryDetails,
            message:"Got the all Tags Details"
        })

    }catch(error){
        res.status(500).json({
            success:false,
            message:"Error in geting All Tags Details"
        })
    }
}

//get catogory , different category , top selling category
exports.getCourseCategory = async (req , res)=>{
    try{
        //get the categoryId
        const categoryId = req.body
        console.log(categoryId.categoryId)
        //get the details of same category
        const sameCategoryDetails = await Category.findById(categoryId.categoryId)
                                                        // .populate("course")
                                                        // .exec()
        //validation
        if(!sameCategoryDetails){
            return res.status(404).json({
                success:false,
                message:"Data not found"
            })
        }
        //get different category courses
        const differentCategDetails = await Category.find({
                                                            _id:{$ne:categoryId.categoryId}
                                                        })

    //HW :  //get top seeling course
    
    return res.status(200).json({
        success:true,
        message:"Got the details",
        data:{
            sameCategoryDetails,
            differentCategDetails
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