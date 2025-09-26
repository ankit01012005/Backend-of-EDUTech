const express = require("express")
const router = express.Router()

const { auth, isInstructor } = require("../middlewares/middleware")
const {
  deleteUser,
  updateProfile,
  // getAllUserDetails,
  // updateDisplayPicture,
  // getEnrolledCourses,
  // instructorDashboard,
} = require("../controllers/profileUpdate")

// Profile routes

// Delet User Account
router.delete("/deleteProfile", auth, deleteUser)
router.put("/updateProfile", auth, updateProfile)
// router.get("/getUserDetails", auth, getAllUserDetails)
// // Get Enrolled Courses
// router.get("/getEnrolledCourses", auth, getEnrolledCourses)
// router.put("/updateDisplayPicture", auth, updateDisplayPicture)
// router.get("/instructorDashboard", auth, isInstructor, instructorDashboard)

module.exports = router