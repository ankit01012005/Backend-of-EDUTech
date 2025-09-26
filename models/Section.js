const mongoose = require("mongoose")
const Subsection = require("./Subsection")

const SectionSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    Subsections:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Subsection",
        required:true
    }]
})

module.exports = mongoose.model("Section",SectionSchema)