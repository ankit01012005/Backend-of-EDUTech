// Import the required modules
const express = require("express")
const router = express.Router()


// Course Controllers Import
const {
  createCourse,
  getAllCourses,
  getCourseDetails,
  // getFullCourseDetails, !
  // editCourse, !
  // getInstructorCourses, !
  // deleteCourse, !
} = require("../controllers/createCourse")

// Categories Controllers Import
const {
  showAll_category,
  createCategory,
  getCourseCategory,
} = require("../controllers/Category")

// Sections Controllers Import
const {
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/createSection")

// Sub-Sections Controllers Import
const {
  createsubSection,
  // updateSubSection, !
  // deleteSubSection, !
} = require("../controllers/createsubSection")

// Rating Controllers Import
const {
  createRatting,
  averageRating,
  getAllratingAndreviews,
} = require("../controllers/rattingAndreview")
//course progress !
//!!!!!!
// const {
//   updateCourseProgress,
//   getProgressPercentage,
// } = require("../controllers/courseProgress")

// Importing Middlewares
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/middleware")

//course routes

router.post("/createCourse", auth, isInstructor, createCourse)

//!!!!!
// // Edit Course routes
// router.post("/editCourse", auth, isInstructor, editCourse)

router.post("/addSection", auth, isInstructor, createSection)

router.post("/updateSection", auth, isInstructor, updateSection)

// Delete a Section
router.post("/deleteSection", auth, isInstructor, deleteSection)

//!!!!!
// // Edit Sub Section
// router.post("/updateSubSection", auth, isInstructor, updateSubSection)

// // Delete Sub Section
// router.post("/deleteSubSection", auth, isInstructor, deleteSubSection)

// Add a Sub Section to a Section
router.post("/addSubSection", auth, isInstructor, createsubSection)

//!!!!
// // Get all Courses Under a Specific Instructor
// router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)

// Get all Registered Courses
router.get("/getAllCourses", getAllCourses)

// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails)

//!!!!
// // Get Details for a Specific Courses
// router.post("/getFullCourseDetails", auth, getFullCourseDetails)

//!!!!
// // To Update Course Progress
// router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress)

// // To get Course Progress
// // router.post("/getProgressPercentage", auth, isStudent, getProgressPercentage)
// // Delete a Course
// router.delete("/deleteCourse", deleteCourse)

//Category routes (Only by Admin)

router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", showAll_category)
router.get("/categoryPageDetails", getCourseCategory)

//Rating and Review
router.post("/createRating", auth, isStudent, createRatting)
router.get("/getAverageRating", averageRating)
router.get("/getReviews",   getAllratingAndreviews,)

module.exports = router