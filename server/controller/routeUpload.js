const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const cloudinary = require('../utils/cloudinary');


router.post('/upload',upload.single('song'),(req,res)=>{
    if(!req.file){
        return res.status(400).json({
            success:false,
            message:"No file uploaded"
        })
    }
    const room = req.body.room;
    cloudinary.uploader.upload(req.file.path,{
        resource_type: 'video',
        folder: `songs/${room}`,
        public_id: req.file.originalname.split('.')[0]
    },(err,result)=>{
        if(err){
            console.error("Error uploading to Cloudinary: ", err);
            return res.status(500).json({
                success:false,
                message:"Error uploading to Cloudinary"
            })
        }
        console.log("File uploaded successfully to Cloudinary: ",result);
        res.status(200).json({
            success:true,
            message:"File Uploaded Successfully",
            url: result.secure_url,
            name:result.public_id
        })
    })
});

router.get('/defaultsongs',async(req,res)=>{
    try{
        
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix:`defaultsongs`,
            resource_type: 'video',
        });
        const songs = result.resources.map(song=>({
                public_id: song.public_id,
                url:song.secure_url, 
        }));
        console.log("Fetched songs from Cloudinary");
        res.status(200).json({
            success:true,
            data:songs
        });
    }catch(err){
        console.error("Error fetching songs from Cloudinary: ", err);
        res.status(500).json({
            success:false,
            message:"Error fetching songs"
        });
    }
})

router.get('/songs',async(req,res)=>{
    try{
        const room = req.query.room;
       
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix:`songs/${room}/`,
            resource_type: 'video',
        });
        const songs = result.resources.map(song=>({
                public_id: song.public_id,
                url:song.secure_url, 
        }));
        console.log("Fetched songs from Cloudinary");
        res.status(200).json({
            success:true,
            data:songs
        });
    }catch(err){
        console.error("Error fetching songs from Cloudinary: ", err);
        res.status(500).json({
            success:false,
            message:"Error fetching songs"
        });
    }
})

module.exports = router;