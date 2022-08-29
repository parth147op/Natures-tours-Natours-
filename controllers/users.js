const User = require('../models/user');
const factory = require('./handleFactory');
const multer = require('multer');
const multerStorage = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'public/img/users');
  },
  filename:(req,file,cb)=>{
    cb(null,`user-${req.user._id}-${Date.now()}.jpg`);
  }
});
const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null,true);
  }
  else{
    cb(console.log("Not an image! Please upload only images"),false);
  }
}
const upload = multer({
  storage:multerStorage,
  fileFilter:multerFilter
})
 
exports.uploadUserPhoto = upload.single('photo');
//admin  
exports.getUsers = async(req,res,next)=>{
    const users = await User.find({active:true});

    res.status(200).json({
        status:`success`,
        results:users.length,
        data:{
            users:users
        }
    })
}
//admin
exports.getUser = async(req,res,next)=>{
  const user = await User.findById(req.params.id);
  res.status(200).json({
    status:`success`,
    data:{
      user:user
    }
  })
}
//admin

exports.updateUserData = async(req,res,next)=>{
  const user = await User.findByIdAndUpdate(req.params.id,req.body);

  return res.status(200).json({
    status:`success`,
    message:`User Data Updated Successfully!!!!`,
    user
  })
}

//admin
exports.deleteUser = async(req,res,next)=>{
  await User.findByIdAndDelete(req.params.id,{active:false});
  res.status(204).json({
    status: 'success',
    data: null
  });
}
//user
exports.getCurrUser = async(req,res,next)=>{
  const user = await User.findById(req.user.id);
  if(!user){
    return res.status(404).json({
      status:`fail`,
      message:`Something went wrong!!!!`
    })
  }
  return res.status(201).json({
    status:`success`,
    data:{
      user:user
    }
  })
}
//user
exports.updateCurrUserData = async(req,res,next)=>{
    try{
      console.log(req.file);
      const user = await User.findByIdAndUpdate(req.user.id,{name:req.body.name,email:req.body.email,photo:req.file.filename},{
        new:true,
        runValidators:true
      });
      return res.status(200).json({
        status:`success`,
        message:`User Data Updated Successfully!!!!`,
        user
      })
    }
    catch(err){
      return res.status(401).json({
        status:`fail`,
        message:err
      })
    }
  }
//user
exports.deleteMe = async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id,{active:false});
    res.status(204).json({
      status: 'success',
      data: null
    });
  }
