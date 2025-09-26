const Razorpay = require("razorpay");

exports.razorpay = new Razorpay({
        key_id: process.env.YOUR_KEY_ID,
        key_secret: process.env.YOUR_KEY_SECRET,
    })
