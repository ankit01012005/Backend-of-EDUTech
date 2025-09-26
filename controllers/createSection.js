const SECTION = require("../models/Section")
const COURSE = require("../models/Course")

exports.createSection = async (req , res)=>{
 try{
        //get the data
        const {name,courseId} = req.body
        console.log(name , courseId)


        //validate the data
        if(!name || !courseId){
            return res.status(401).json({
                success:true,
                message:"Please enter the name of the section"
            })
        }
        const Subsection=null


        //create the section
        const created_Section = await SECTION.create({name,Subsection})
        console.log("created section")
        console.log(created_Section)


        //update in the course
        const updated_in_course = await COURSE.findByIdAndUpdate(courseId,
                                                                    {
                                                                        $push:{
                                                                            courseContent:created_Section._id
                                                                        }
                                                                    },
                                                                    {new:true}
                                                                 )//.populate("courseContent")
        //return res
        console.log(updated_in_course)
        return res.status(200).json({
            success:true,
            message:"section created successfully"
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
            //get new name and id of section
        const{sectionName,sectionId} = req.body
        if(!sectionName || !sectionId){
            return res.status(401).json({
                success:false,
                message:"name and section id are required"
            })
        }

        //update the section
        updatedSection = await SECTION.findByIdAndUpdate(sectionId,
                                                                    {
                                                                        name:sectionName
                                                                    },
                                                                    {new:true}
                                                        )


        //send response
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

//delete the sectin

exports.deleteSection = async (req , res)=>{
    try{
        //get the id through params //:id
        const{sectionId , courseId} = req.body
        console.log(sectionId)


        //delete the section
        await SECTION.findByIdAndDelete(sectionId)
        console.log("deleted the section")
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