const PROFILE = require("../models/Profile")
const USER = require("../models/User")
const COURSE = require("../models/Course")
const cron = require("node-cron") // 🔧 MODIFICATION #2-A: Added cron-job scheduling support
const { ObjectId } = require('mongodb');

exports.updateProfile = async (req , res)=>{
    try{
        const{dateofBirth="",about="",contactNumber,gender} = req.body
        const userId = req.user.id

        // Validate required fields
        if(!userId || !contactNumber || !gender){
            return res.status(400).json({
                success:false,
                message:"Contact number and gender required"
            })
        }

        // Get user details
        const userDetails = await USER.findById(userId)
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        // Update user profile
        const profileId = userDetails.additionalInfo
        const profileDetails = await PROFILE.findById({_id:profileId})

        profileDetails.contactNumber = contactNumber
        profileDetails.about = about
        profileDetails.gender = gender
        profileDetails.dateOfBirth = dateofBirth
        await profileDetails.save()

        return res.status(200).json({
            success:true,
            profileDetails,
            userDetails,
            message:"Profile updated successfully"
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Error updating profile"
        })
    }
}

// Delete user account and clean up enrollments
exports.deleteUser = async (req ,res)=>{
    try{
        const id = req.user?.id

        // Validate user exists
        const userfound = await USER.findById(id)
        if(!userfound){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        
        // Delete user profile
        await PROFILE.findByIdAndDelete({_id:userfound.additionalInfo})
        
        // Remove user from all enrolled courses
        const courseDetails = userfound.courses
        if(courseDetails && courseDetails.length > 0){
            try {
                for(let i = 0; i < courseDetails.length; i++){
                    await COURSE.findByIdAndUpdate(
                        { _id: courseDetails[i] },
                        { $pull: { studentEnrolled: id } },
                        { new: true }
                    )
                }
            } catch (error) {
                // Continue deletion if enrollment cleanup fails
            }
        }

        // Delete user
        await USER.findByIdAndDelete({_id:id})

        return res.status(200).json({
            success:true,
            message:"User deleted successfully"
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Error deleting user"
        })

    }
}

// ============================================================================
// 🔧 MODIFICATION #2-C: SCHEDULED ACCOUNT DELETION WITH CRON JOB
// Added: Function to schedule user account deletion after a delay (e.g., 30 days)
// Date: November 18, 2025
// Purpose: Allows users to recover account within grace period, then auto-deletes
// Features: Scheduled job management, grace period, recovery option
// ============================================================================
exports.scheduleAccountDeletion = async (req, res) => {
    try {
        const userId = req.user.id
        const gracePeriodDays = req.body.gracePeriodDays || 30 // Default 30 days

        // Find user
        const user = await USER.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // Calculate deletion date (grace period from now)
        const deletionDate = new Date()
        deletionDate.setDate(deletionDate.getDate() + gracePeriodDays)

        // Add deletion scheduled flag and date to user
        user.isDeleteScheduled = true
        user.scheduledDeletionDate = deletionDate
        await user.save()

        // Create cron job to delete account at scheduled time
        const cronExpression = `${deletionDate.getMinutes()} ${deletionDate.getHours()} ${deletionDate.getDate()} ${deletionDate.getMonth() + 1} *`
        
        cron.schedule(cronExpression, async () => {
            try {
                // Check if deletion is still scheduled (user might have cancelled)
                const userToDelete = await USER.findById(userId)
                
                if (userToDelete && userToDelete.isDeleteScheduled && 
                    new Date() >= userToDelete.scheduledDeletionDate) {
                    
                    console.log(`Auto-deleting account for user: ${userId}`)
                    
                    // Perform the deletion using existing deleteUser logic
                    // Remove from all enrolled courses
                    if (userToDelete.courses && userToDelete.courses.length > 0) {
                        for (let courseId of userToDelete.courses) {
                            await COURSE.findByIdAndUpdate(
                                { _id: courseId },
                                { $pull: { studentEnrolled: userId } },
                                { new: true }
                            )
                        }
                    }
                    
                    // Delete profile
                    await PROFILE.findByIdAndDelete(userToDelete.additionalInfo)
                    
                    // Delete user
                    await USER.findByIdAndDelete(userId)
                    
                    console.log(`Account successfully deleted for user: ${userId}`)
                }
            } catch (error) {
                console.log(`Error in scheduled deletion for user ${userId}:`, error)
            }
        })

        return res.status(200).json({
            success: true,
            message: `Account scheduled for deletion in ${gracePeriodDays} days (${deletionDate.toISOString()})`,
            scheduledDeletionDate: deletionDate,
            canRecoverUntil: deletionDate
        })

    } catch (error) {
        console.log("Error scheduling account deletion:", error)
        return res.status(500).json({
            success: false,
            message: "Error while scheduling account deletion, try again"
        })
    }
}

// ============================================================================
// 🔧 MODIFICATION #2-D: CANCEL SCHEDULED ACCOUNT DELETION
// Added: Function to cancel scheduled deletion (account recovery)
// Date: November 18, 2025
// Purpose: Allow users to cancel deletion within grace period
// ============================================================================
exports.cancelScheduledDeletion = async (req, res) => {
    try {
        const userId = req.user.id

        // Find user
        const user = await USER.findById(userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // Check if deletion was actually scheduled
        if (!user.isDeleteScheduled) {
            return res.status(400).json({
                success: false,
                message: "No deletion was scheduled for this account"
            })
        }

        // Check if grace period has expired
        if (new Date() > user.scheduledDeletionDate) {
            return res.status(400).json({
                success: false,
                message: "Grace period has expired, account has been deleted"
            })
        }

        // Cancel the scheduled deletion
        user.isDeleteScheduled = false
        user.scheduledDeletionDate = null
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Account deletion has been cancelled successfully",
            accountRecovered: true
        })

    } catch (error) {
        console.log("Error cancelling scheduled deletion:", error)
        return res.status(500).json({
            success: false,
            message: "Error while cancelling deletion, try again"
        })
    }
}