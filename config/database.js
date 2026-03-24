const mongoose = require("mongoose")
require("dotenv").config()

exports.connect = ()=>{
    mongoose.connect(process.env.DATABASE_URL)
    .then(()=>{
        console.log("Database connection successful")
    })
    .catch((error)=>{
        console.error("Database connection failed:", error.message)
        process.exit(1)
    })
}
