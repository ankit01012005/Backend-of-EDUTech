const mongoose = require("mongoose")
require("dotenv").config()

exports.connect = ()=>{
    mongoose.connect(process.env.DATABASE_URL)
    .then(()=>{
        console.log("DB connection Successfull")
    })
    .catch((error)=>{
        console.log(error)
        console.log("DB connection Failed")
    })
}
