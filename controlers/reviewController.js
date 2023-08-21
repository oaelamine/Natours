const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('./../utils/appError');

const factory = require('./../controlers/handlerFactory');

exports.setUserAndTourId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

//function to get all the reviews
exports.getAllReviews = factory.getAll(Review);

//function to create a new review
exports.createReview = factory.createOne(Review);

//function to read one review
exports.getReviews = factory.getOne(Review);

//function to delete a review
exports.deleteReview = factory.deleteOne(Review);

//function to update a review
exports.updateReview = factory.updateOne(Review);
