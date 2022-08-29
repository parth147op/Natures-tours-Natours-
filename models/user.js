const crypto = require('crypto');
const mongoose = require("mongoose");
const validator = require("validator");
const schema = mongoose.Schema;
const bcryptjs = require('bcryptjs');
const userSchema = new schema({
  name: {
    type: String,
    require: [true, `Please tell me your name!!!`],
  },
  email: {
    type: String,
    require: [true, `Please provide your email!!!`],
    unique: true,
    validate: [validator.isEmail, `Please Provide Email`],
  },
  photo: {
    type:String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active:{
    type:Boolean,
    default:true,
    select:false
  }
});

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }

    this.password = await bcryptjs.hash(this.password,12);
    this.passwordConfirm = undefined; //since passwordConfirm is just needed for validation, it is of use once its validated....
    next();
})
userSchema.pre('save',async function(next){
  if(!this.isModified('password') || this.isNew){
    return next();
  }
  this.passwordChangedAt=Date.now()-1000;
  next();
})

userSchema.methods.correctPassword=function(inputpassword,correctpassword){
    return bcryptjs.compare(inputpassword,correctpassword);
}

userSchema.methods.changePasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = this.passwordChangedAt.getTime()/1000;
        return JWTTimestamp< changedTimestamp;     
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now()+10*60*1000;
  return resetToken;
}
module.exports = mongoose.model('User',userSchema);
