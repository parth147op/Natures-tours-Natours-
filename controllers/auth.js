const User = require("../models/user");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const sendEmail = require("../utils/email");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};
const sendCookie = (token, res) => {
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  });
};
exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES,
    });
    sendCookie(token, res);
    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: `fail`,
      message: err,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: `fail`,
        message: "Please provide email and password!",
      });
    }
    const user = await User.findOne({ email: email }).select("+password");
    console.log(user);
    const token = signToken(user._id);
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(400).json({
        status: `fail`,
        message: "Incorrect email and password!",
      });
    }
    sendCookie(token, res);
    res.status(201).json({
      status: "success",
      token,
      data: {
        user: user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: `fail`,
      message: err,
    });
  }
};

exports.logout = (req,res)=>{
  res.cookie('jwt','loggedout',{
    expires:new Date(Date.now()),
    httpOnly:true
  });
  res.status(200).json({status:'success'});
}
// Only for rendered pages, no errors!
exports.isLoggedin = async (req, res, next) => {
  //1) Getting Token and check of it's there
  if(req.cookies.jwt){
    try{
      //1)verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET_KEY
      );
      //2)check if user still exists
      const currentUser = await User.findById(decoded.id);
      if(!currentUser){
        return next();
      }   
      //3)check if user changed password after token was issued
      if(currentUser.changePasswordAfter(decoded.iat)){
        return next();
      }
      //there is a logged in user
      res.locals.user = currentUser;
      return next();
    }catch(err){
      return next();
    }
  }
  next();
};
exports.protect = async (req, res, next) => {
  //1) Getting Token and check of it's there
  var token;
  console.log(req.cookies.jwt.split(" ")[0]);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (req.cookies.jwt){
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.status(401).json({
      status: `fail`,
      message: `You are not logged in! Please log in to get access.`,
    });
  }
  console.log('abcd '+token);
  //2) Verification Token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  console.log(decoded);
  //3) Check if user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return res.status(401).json({
      status: `fail`,
      message: `The user belonging to this token does no longer exist.`,
    });
  }
  //4) Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return res.status(401).json({
      status: `fail`,
      message: `User recently changed password! Please log in again.`,
    });
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: `fail`,
        message: `You do not have permission to perform this action.`,
      });
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user based on his/her email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      status: `fail`,
      message: `There is no user with this email address`,
    });
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send reset link to User's emailID
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:${resetURL}.\n If you didn't forgot your password then ignore this email`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset Token`,
      message: message,
    });
    res.status(200).json({
      status: "success",
      message: "Token send to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });
    return res.status(500).json({
      status: "fail",
      message: "err",
    });
  }
};
exports.resetPassword = async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT
  const token = signToken(user._id);
  sendCookie(token, res, res);
  res.status(200).json({
    status: `success`,
    token,
  });
};

exports.updatePassword = async (req, res, next) => {
  try {
    console.log(req.user);
    const user = await User.findById(req.user._id).select("+password");

    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return res.status(401).json({
        status: `fail`,
        message: `Your current password is wrong`,
      });
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    const token = signToken(user._id);
    sendCookie(token, res);
    return res.status(200).json({
      status: `success`,
      token,
      message: `Password updated successfully!!!!`,
    });
  } catch (err) {
    return res.status(401).json({
      status: `fail`,
      message: err,
    });
  }
};
