const mongoose = require('mongoose');

const Tour = require('./../models/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "review cant't bee empty"]
    },
    rating: {
      type: Number,
      max: [5, "rating can't bee more then 5"],
      min: [1, "rating can't bee less the 1"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belog to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belog to a user']
    }
  },
  {
    //thees fields allow us to see virtual property in JASON and OBJECT output
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// this code is used to prevent user to review a tour more then one time
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//QUERY MIDDELWEAR
// this code populate the user data in the review document
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageStatic = async function(tourId) {
  //this point to the current model
  const state = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour', //groupe by tour
        nRating: { $sum: 1 }, //add 1 for etch tour
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (state.length > 0) {
    const { nRating, avgRating } = state[0];
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: nRating,
      ratingsAverage: avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  //this point to current review (the document)
  //this.constructor point to the current Model
  this.constructor.calcAverageStatic(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  // this.rev = : we used this trick tou pass data from pre middel to post middel
  this.rev = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  await this.rev.constructor.calcAverageStatic(this.rev.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
