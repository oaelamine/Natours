const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');

exports.getOverview = catchAsync(async (req, res) => {
  // 1) get the all the tours data

  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'ALL TOURS',
    tours
  });
});

// DISPLAY ALL THE TOURS
exports.getTour = catchAsync(async (req, res, next) => {
  const { tourName } = req.params;

  const tour = await Tour.findOne({ slug: tourName }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  console.log(tour);

  if (!tour) return next(new AppError(404, 'Tour not found'));

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour: tour
  });
});

// DISPLAY THE LOGIN FORM
exports.getLoginFrom = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login'
  });
};

// DISPLAY THE USER ACCOUNT INFORMATION
exports.getUserInfo = (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

//UPDATE USER DATA " USING THE FORM SUBMITION "
exports.updateUserData = catchAsync(async (req, res, next) => {
  const data = {
    name: req.body.name,
    email: req.body.email
  };
  const updatedUser = await User.findByIdAndUpdate(req.user.id, data, {
    new: true,
    runValidators: true
  });

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  });
});
