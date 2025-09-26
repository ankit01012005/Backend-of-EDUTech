
// Import the required modules
const express = require("express")
const router = express.Router()

// Import the required controllers and middleware functions
const {
  Login,
  SignUp,
  GenerateOTP,
  changePassword,
} = require("../controllers/Auth")
const {
  resetPasswordToken,
  resetPassword,
} = require("../controllers/ResetPassword")

const { auth } = require("../middlewares/middleware")
// Route for user login
router.post("/login", Login)

// Route for user signup
router.post("/signup", SignUp)

// Route for sending OTP to the user's email
router.post("/sendotp", GenerateOTP)

// Route for Changing the password
router.post("/changepassword", auth, changePassword)

//Reset Password

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)

// Export the router for use in the main application
module.exports = router