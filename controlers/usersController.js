const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

const factory = require('./../controlers/handlerFactory');

//FUNCTIONS
const filterBody = (body, ...fields) => {
  const obj = {};
  fields.forEach(el => {
    if (Object.keys(body).includes(el)) obj[el] = body[el];
  });
  return obj;
};

///////////////////////USERS
//USER ROUTE HANDLER
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'succsess',
    data: {
      users
    }
  });
});

exports.createUser = function(req, res) {
  res.status(500).json({
    status: 'fail',
    message: 'this url is not defained, user sign in'
  });
};
exports.getOneUsers = factory.getOne(User);

//function to update a user
exports.updateUser = factory.updateOne(User);

//function to delete a user
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// function to update user data NOT tha password
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) check if the user pass password data
  if (req.body.password || req.passwordConfirm)
    return next(
      new AppError(
        400,
        'This route is not for password update, use /updatePassword'
      )
    );

  // 2) check if the user exists, and update
  // 2. 1) filter the req.body for unwanted fields
  const info = filterBody(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, info, {
    new: true,
    runValidator: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // 1) check the user password
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.password, user.password)))
    return next(new AppError(401, 'incorrect password'));

  await User.findByIdAndUpdate(user.id, { active: false });

  res.status(204).json({
    status: 'success'
  });
});
