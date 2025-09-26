const PROFILE = require("../models/Profile")
const USER = require("../models/User")
const COURSE = require("../models/Course")

exports.updateProfile = async (req , res)=>{
    try{
        //get data -> (dateofbirth-o , about-o , constactnumber , gender)
        const{dateofBirth="",about="",contactNumber,gender} = req.body
        
        //get the user id
        const userId = req.user.id

        //validate the data
        if(!userId || !contactNumber || !gender){
            return res.status(401).json({
                success:false,
                message:"All field are must required !"
            })
        }
        //get the user details
        const userDetails = await USER.findById(userId)
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:"Not found user"
            })

        }
         console.log("userdetails : ",userDetails)

        //get the profile detail
        const profileId = userDetails.additionalInfo
        console.log(profileId)

        const profileDetails = await PROFILE.findById({_id:profileId})

        //update the profile
        profileDetails.contactNumber = contactNumber
        profileDetails.about = about
        profileDetails.gender = gender
        profileDetails.dateOfBirth = dateofBirth
        await profileDetails.save()
        // userDetails.populate("additionalInfo").exec()
        //return response
        return res.status(200).json({
            success:true,
            profileDetails,
            userDetails,
            message:"Profile updated successfully",    
        })

    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error while updating profile , try again"
        })
    }
}
//have study on chrone job
//delete account
exports.deleteUser = async (req ,res)=>{
    try{
            //get id
        const id = req.user.id
        //validate user
        const userfound = await USER.findById(id)
        if(!userfound){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        //delete profile
        await PROFILE.findByIdAndDelete({_id:userfound.additionalInfo})
        //HW:delete the exitace of details in the student enrolled before deleting the user
        const courseDetails = userfound.courses
        if(courseDetails){
            for(let i=0; i<=courseDetails.length; i++){
            //in this line we have to decrement the student enrolled but its being deleted here 
            //have to correct it
           const updatedEntrolled_student = await COURSE.findOneAndUpdate({_id:courseDetails[i]},
                                                {
                                                    $pull:
                                                    {
                                                        studentEnrolled:id
                                                    }
                                                },
                                                {
                                                    new:true
                                                }
                                        )
        } 
        }
        

        //delete user
        await USER.findByIdAndDelete({_id:id})
        //return response
        return res.status(200).json({
            success:true,
            message:"User delete successfully"
        })

    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Error while deleting profile , try again"
        })

    }
}

//HW: how to schedule any request
//