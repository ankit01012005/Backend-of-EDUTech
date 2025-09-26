const cloudinary = require('cloudinary').v2

exports.imageuploadTo_Cloundinary = async (file , folder , height , quality)=>{
    console.log(file , folder)
    const options = {folder}
    if(height){

        options.height = height

    }
    if(quality){
        options.quality = quality
    }
    options.resoureType = "auto"
    console.log("upload hone ko h broh")
    const uploaded = await cloudinary.uploader.upload(file.tempFilePath ,options)
    return uploaded
}