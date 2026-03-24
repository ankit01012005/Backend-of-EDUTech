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

// ============================================================================
// 🔧 MODIFICATION #1-A: UPDATE SUBSECTION FUNCTION
// Added: Update subsection details including title, duration, description, and video
// Date: November 18, 2025
// Features: Video re-upload to Cloudinary, field validation, error handling
// ============================================================================
exports.updateSubSection = async (req, res) => {
    try {
        // Get data from request body
        const { subsectionId, title, timeduration, description } = req.body
        const videoFile = req.files?.videoFile

        // Validate required fields
        if (!subsectionId) {
            return res.status(400).json({
                success: false,
                message: "Subsection ID is required"
            })
        }

        // Find existing subsection
        const subsection = await SUBSECTION.findById(subsectionId)
        if (!subsection) {
            return res.status(404).json({
                success: false,
                message: "Subsection not found"
            })
        }

        // Update fields if provided
        if (title) subsection.title = title
        if (timeduration) subsection.timeDuration = timeduration
        if (description) subsection.description = description

        // If new video is uploaded, upload to Cloudinary
        if (videoFile) {
            try {
                const uploadedVideo = await imageuploadTo_Cloundinary(videoFile, process.env.FOLDER_NAME)
                subsection.videoUrl = uploadedVideo.secure_url
            } catch (error) {
                console.log("Error uploading video to Cloudinary:", error)
                return res.status(500).json({
                    success: false,
                    message: "Error uploading video to Cloudinary"
                })
            }
        }

        // Save updated subsection
        await subsection.save()

        return res.status(200).json({
            success: true,
            message: "Subsection updated successfully",
            subsection
        })

    } catch (error) {
        console.log("Error updating subsection:", error)
        return res.status(500).json({
            success: false,
            message: "Error while updating subsection, try again"
        })
    }
}

// ============================================================================
// 🔧 MODIFICATION #1-B: DELETE SUBSECTION FUNCTION
// Added: Delete subsection and remove reference from section
// Date: November 18, 2025
// Features: Cascade deletion, validation, cleanup of section references
// ============================================================================
exports.deleteSubSection = async (req, res) => {
    try {
        // Get subsection ID from request
        const { subsectionId, sectionId } = req.body

        // Validate inputs
        if (!subsectionId || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Subsection ID and Section ID are required"
            })
        }

        // Find and verify subsection exists
        const subsection = await SUBSECTION.findById(subsectionId)
        if (!subsection) {
            return res.status(404).json({
                success: false,
                message: "Subsection not found"
            })
        }

        // Remove subsection from section's Subsections array
        const updatedSection = await SECTION.findByIdAndUpdate(
            { _id: sectionId },
            { $pull: { Subsections: subsectionId } },
            { new: true }
        )

        if (!updatedSection) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            })
        }

        // Delete the subsection from database
        await SUBSECTION.findByIdAndDelete(subsectionId)

        return res.status(200).json({
            success: true,
            message: "Subsection deleted successfully",
            updatedSection
        })

    } catch (error) {
        console.log("Error deleting subsection:", error)
        return res.status(500).json({
            success: false,
            message: "Error while deleting subsection, try again"
        })
    }
}
