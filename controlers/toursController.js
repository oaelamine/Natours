const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const factory = require('./../controlers/handlerFactory');

//MIDELWEAR
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'ratingsAverage,name,price,summary,difficulty';
  next();
};

//AGREGATION
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        totalTours: { $count: {} },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: {
      stats
    }
  });
});

exports.getMounthelyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' //dispache an array
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        totalTours: { $count: {} },
        tours: { $push: '$name' }
      }
    },
    {
      $sort: { totalTours: -1 }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: { _id: 0 }
    }
  ]);
  res.status(200).json({
    status: 'sucsess',
    date: {
      plan
    }
  });
});

//GET REQUEST
exports.getAllToures = factory.getAll(Tour);

//GET REQUEST WTH A SPESSIFIQUE ID
exports.getOneToures = factory.getOne(Tour, 'reviews');

//POST REQUEST
exports.createToure = factory.createOne(Tour);

//UPDATE REQUESTE
exports.updateToure = factory.updateOne(Tour);

//DELETE REQUEST
exports.deleteToure = factory.deleteOne(Tour);

//function to get tours that are close to the user location
exports.getToursWithin = catchAsync(async (req, res, next) => {
  // /tour-within/:distance/center/:latlng/unit/:unit
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(400, 'please eneter the coordinates in lat,lng format')
    );
  }

  const tour = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    result: tour.length,
    data: {
      data: tour
    }
  });
});

exports.getToursDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const Multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(400, 'please eneter the coordinates in lat,lng format')
    );
  }

  const ditences = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distenceMultiplier: Multiplier
      }
    },
    {
      $project: { name: 1, distance: 1 }
    }
  ]);

  // const data = ditences.map(el => {
  //   return {
  //     name: el.name,
  //     distance: el.distance / 1000
  //   };
  // });

  res.status(200).json({
    status: 'success',
    data: {
      data: ditences
    }
  });
});
