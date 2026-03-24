const SECTION = require("../models/Section")
const COURSE = require("../models/Course")

exports.createSection = async (req , res)=>{
 try{
        const {name,courseId} = req.body

        // Validate required fields
        if(!name || !courseId){
            return res.status(400).json({
                success:false,
                message:"Section name and course ID required"
            })
        }

        // Create section
        const created_Section = await SECTION.create({name, Subsection:null})

        // Update course with new section
        const updated_in_course = await COURSE.findByIdAndUpdate(courseId,
                                                                    {$push:{courseContent:created_Section._id}},
                                                                    {new:true}
        )

        return res.status(200).json({
            success:true,
            message:"Section created successfully"
        })

 }catch(error){
    console.log(error)
    return res.status(500).json({
        success:false,
        message:"Error while creating section"
    })

 }
}

exports.updateSection = async (req , res)=>{
    try{
        const{sectionName,sectionId} = req.body

        // Validate required fields
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:"Section name and ID required"
            })
        }

        // Update section
        const updatedSection = await SECTION.findByIdAndUpdate(sectionId,
                                                                    {name:sectionName},
                                                                    {new:true}
        )

        return res.status(200).json({
            success:true,
            message:"Section updated successfully"
        })

    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error while updating section , try again"
        })

    }
}

// Delete section
exports.deleteSection = async (req , res)=>{
    try{
        const{sectionId , courseId} = req.body

        // Delete section
        await SECTION.findByIdAndDelete(sectionId)
        //delete from course
        await COURSE.findByIdAndUpdate(courseId,
                                        {$pull:{courseContent:sectionId}},
                                        {new:true}
                                    )
                                    console.log("deleted from the cousrse")
    
        //send the response
        return res.status(200).json({
            success:true,
            message:"Section deleted successfully."
        })

    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error while deleting section , try again"
        })

    }

}