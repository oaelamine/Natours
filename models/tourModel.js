const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// const User = require('./userModel');

//CREATING THE SCHEMA
const tourSchema = new mongoose.Schema(
  {
    startLocation: {
      //Geospatial
      type: {
        type: String,
        default: 'Point', //coordinates option
        enum: ['Point']
      },
      coordinates: [Number], //array of numbers [lng, lat] NOT [lat, lng]
      address: String,
      description: String
    },
    locations: [
      // we need to make it an array so we ist ganna be recognized and seperate documents
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    name: {
      type: String,
      required: [true, 'a tour must have a name'],
      unique: true,
      maxlength: [40, 'you cant use more then 40 chars'],
      minlength: [10, 'you cant use less then 10 chars']
      // validate: [validator.isAlpha, 'the name is only chars']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty needs to bee easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'must bee more then 1'],
      max: [5, 'must bee below then 5'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      deafult: 0
    },
    price: {
      type: Number,
      required: [true, 'a toure must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this will point to the document
          return val >= this.price;
        },
        message: 'price not correct'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must ahve a discription']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: {
      type: [String]
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: {
      type: [Date]
    },
    sercetTour: {
      type: Boolean,
      default: false
    },
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// //DOCUMENT MIDELWEAR: runs before .save(), and .create() NOT .insertMeny()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.post('save', function(doc, next) {
//   // console.log(doc);
//   next();
// });

// //QUERY MIDELWEAR
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});
// tourSchema.pre(/^find/, function(next) {
//  //this point to the current query
//   //Ga3 li yebdaw b find
//   this.find({ sercetTour: { $ne: true } });
//   this.start = Date.now();

//   next();
// });
// tourSchema.post(/^find/, function(doc, next) {
//   console.log(`THE QUERY HASE TAKE ${Date.now() - this.start} ms TO EXECUTE`);
//   next();
// });

// //AGREGATION MIDELWEAR
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({
//     $match: { sercetTour: { $ne: true } }
//   });
//   next();
// });
//INITIATING THE A NEW COLLECTION
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
