const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const Email = require('../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  //encodes the id of the user into the payload of the JWT and encrypt it with the JWT_SECRET
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id); //assigning a new token to the user (happi! happi! happi!)

  const cookieOptions = {
    //creating a cookie that will be sent to the browser by server
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined; //remove passwords

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //creates a new document in the users collection
  const newUser = await User.create(req.body);

  // const token = signToken(newUser._id); //create a new JWT and send it to the user

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  //   const correct = await user.correctPassword(password, user.password); //true/false

  //comapre the provided password with the correct password
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!'));
  }

  // const token = signToken(user._id); //send the token to the user
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer') //USING BEARER TOKEN AUTHENTICAITON
  ) {
    token = req.headers.authorization.split(' ')[1]; //TAKING THE JWT FROM THE REQ HEADER
  }
  // console.log(token);

  if (!token) {
    //returning error if no token is found => user wasn't provided with one since he hasn't logged in
    return next(new AppError('You are not logged in!'), '401');
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //DECODING THE TOKEN AT THE SERVER USING THE JWT SECRET KEY
  // console.log(decoded, decoded.id); //check
  // console.log(decoded); //decoded payload of the web token - consists of issuetime expiretime and an id

  const currentUser = await User.findById(decoded.id); //seaching for _id of the user document in the users collection
  if (!currentUser) {
    return next(
      new AppError('User not found for the corresponding token!', 401) //returning error if no user was found for the id in the decoded JWT
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //COMPARING THE TOKEN ISSUE TIME AND PASSWORD RESET TIME
    return next(
      new AppError(
        'User recently changed the password! Please log in again!',
        401
      )
    );
  }

  req.user = currentUser; //adding a user field in the request with the current user id as the value
  console.log(req.user);
  next(); //move to the next middleware
});

exports.restrictTo = (...roles) => {
  //destructuring the roles
  return (req, res, next) => {
    // console.log(req.user.role);
    if (!roles.includes(req.user.role)) {
      //returns true if the provided role is not what is provided
      return next(
        new AppError('You do not have the permission to do this!', 403)
      );
    }
    next(); //moves on to the next middleware
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }); //fetching the user document
  if (!user) {
    return next(new AppError('NO USER FOUND FOR THIS EMAIL ADDRESS!', 404));
  }

  const resetToken = user.createPasswordResetToken(); //creating a new reset token on the node server in the document using crypto and a password-reset expiry
  await user.save({ validateBeforeSave: false });

  //redirecting the user to the reset-password url
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`;
  const message = `Submit a patch request with your new password and confirm password to ${resetURL}.\n If you didn't forget your password, Please ignore this email`;
  console.log(message);
  try {
    // await Email({
    //   //sends the email to the user(mailtrap for now) => email.js
    //   email: user.email,
    //   subject: 'Your passwd reset token! (valid for 10 mins)',
    //   text: message, // message contains the resetURL & the resetURL contains the resetToken
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending email! Try again later'), 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //in the req params this route receives a token which is the resetToken
  const hashedToken = crypto //encyrpting it the same way using crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired'));
  }

  //changing the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // const token = signToken(user._id); //assigning a new token to the user (happi! happi! happi!)
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password'); //fetching the user document with password
  console.log(user.password, req.body.passwordCurrent);

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    //checking if the provided password matches the currently set password
    return next(new AppError('Your current password did not match!', 401));

  //changing the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // const token = signToken(user._id); //assigning a new token to the user (happi! happi! happi!)
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});
