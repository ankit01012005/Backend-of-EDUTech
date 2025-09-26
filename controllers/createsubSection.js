const SUBSECTION = require("../models/Subsection")
const SECTION = require("../models/Section")
const { imageuploadTo_Cloundinary } = require("../utills/fileUploader")
require("dotenv").config()

exports.createsubSection = async (req , res)=>{
    try{
        //get the data- > title , sectionId , timeduration , description from body
        const{sectionId,title,timeduration,description} = req.body

        //get the video file from files
       const videoFile = req.Files.videoFile

        //validate the data recieved
        if(!sectionId , !title , !timeduration , !description , !videoFile){
            return res.status(401).json({
                success:false,
                message:"All field are required"
            })
        }

        //upload the video to cloudinary
        uploadedVideo = await imageuploadTo_Cloundinary(videoFile,process.env.FOLDER_NAME)

        //create the subsection - > insert the secureURL recieved from cloudinary to the url section 
        const createdSubSection = await SUBSECTION.create({
            title:title,
            timeDuration:timeduration,
            description:description,
            videoUrl:uploadedVideo.secureUrl
        })

        //update the section by inserting the subsection id
        const updated_Section = await SECTION.findByIdAndUpdate({_id:sectionId},
                                                                            {
                                                                              $push:{Subsections:createdSubSection._id } 
                                                                            },
                                                                            {new:true}
                                                                ).populate("Subsections")
                                                                 .exec(1)

        //retur res
        return res.status(200).json({
            success:true,
            message:"subsection created successfully"
        })


    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error while creating subsection , try again"
        })
    }
}

//HW : UPDATE SUBSECTION
//HW: DELETE SUBSECTION
