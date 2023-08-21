const { promisify } = require('util');
const crypto = require('crypto');
// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/emailHandler');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIER_IN
  });
};

const sendJWT = (res, statusCode, user) => {
  const token = signToken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIER_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_EN === 'production') cookieOption.secure = true; //wock only with HTTPS
  res.cookie('jwt', token, cookieOption);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    date: {
      user
    }
  });
};

//middelwear function to signup a new user
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });
  sendJWT(res, 201, newUser);
});

//middelwear function to log a user in
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if the eamil an password exists
  if (!email || !password) {
    return next(new AppError(400, 'provide an email and a password'));
  }
  // 2) check if the user exists and the password is correct
  //we are selectin the user by his email and sens the password is hidden we need to use .select() to select'it explecetly
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    //401 Unothorised
    return next(new AppError(401, 'Incorrect eamil or password'));
  }
  // 3) sedn teh token to the user if the password and email in correct
  sendJWT(res, 200, user);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'leggedout', {
    expires: new Date(Date.now() + 10000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

//middelwear function to protect certin url's
//this middelwear chck if the user is loged in
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting the token from the header and chesk if its hear
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    [, token] = req.headers.authorization.split(' ');
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    next(
      new AppError(401, "you can't access this page if you are not loged in")
    );
  // 2) token Verification
  const decodedPylode = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // console.log(decodedPylode) output { id: '64b5417e23ec602448c4d241', iat: 1689600383, exp: 1697376383 }
  // 3) Check if the user still exists
  const freshUser = await User.findById(decodedPylode.id);
  if (!freshUser)
    next(new AppError(401, 'the user belonging to this token dos not exists'));
  // 4) check if the user change the password after the toekn get issued
  if (freshUser.checkPasswordUpdated(decodedPylode.iat))
    next(
      new AppError(
        401,
        'User recently changed the password, pleas log in again'
      )
    );
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

//middelwear to check if the user is logged in
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // Verify the token
      const decodedPylode = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // Select the user based on the token
      const currentUser = await User.findById(decodedPylode.id);

      if (!currentUser) return next();

      // Chask if the user changed his password
      if (currentUser.checkPasswordUpdated(decodedPylode.iat)) return next();

      // Pass the user info to the pug template
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};
//middelwear function to restrict deleting to certin rols
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // check fi the user role is in the roles array
    if (!roles.includes(req.user.role))
      return next(
        new AppError(403, "You don't have the previlage to perform this action")
      );
    next();
  };
};

//middelwear to handel the password reset
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError(404, 'No user coresponde to this email address.'));

  // 2) generate a random token
  //this option on the save methode alow us to save changes without passing throw validations
  const randomToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send the token in the email the the provided email (the user's email)
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/resetPassword/${randomToken}`;
  const message = `forgot your password ?, please click on the provided url to reset your password \n ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'password reset (expiers after 10 min)',
      message
    });
    res.status(200).json({
      status: 'success',
      message: 'token sent to user!!!!'
    });
  } catch (err) {
    console.log('error in the forgot function middel');
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpier = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(500, 'ther wase an error, try again later!'));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hachedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  // 1) get the user based on the hached token
  //selecting the user and chesking if the token hase expierd in the same time
  const user = await User.findOne({
    passwordResetToken: hachedToken,
    passwordResetTokenExpier: { $gt: Date.now() }
  });

  // 2) if token not expierd && use,set the new password
  if (!user) return next(new AppError(404, 'user not found or tokrn expierd'));
  //seting the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpier = undefined;
  //dont use validateBeforeSave: false, we need the validation here
  user.save();

  // 3) Updating changPasswordAt
  // chesk userModel for the middelwear presave

  // 4) log the user in and send the jwt
  sendJWT(res, 200, user);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get the user from the collection

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    [, token] = req.headers.authorization.split(' ');
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  const pylode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(pylode.id).select('+password');

  if (!user) return next(new AppError(401, 'user not found'));

  // 2) check if posted current password is correct
  const isCorrect = await user.correctPassword(
    req.body.oldPassword,
    user.password
  );
  if (!isCorrect) return next(new AppError(401, 'password is not correct'));

  // 3) if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) log the user in and send jwt
  sendJWT(res, 200, user);
});
