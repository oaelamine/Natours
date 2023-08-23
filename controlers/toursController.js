const multer = require('multer');
// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const factory = require('./../controlers/handlerFactory');

// multer setup
const multerStroage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(400, 'thees fiels are not images, please upload images'),
      false
    );
  }
};

const upload = multer({
  storage: multerStroage,
  fileFilter: multerFilter
});

exports.resizeYourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Image

  // putt the imageCover in the req.body object
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  //RESIZING THE IMAGE AND STOR4IT IN THE DISK
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 1) Images
  req.body.images = [];

  const tratedImages = req.files.images.map(async (img, inedx) => {
    const imageName = `tour-${req.params.id}-${Date.now()}-${inedx + 1}.jpeg`;

    await sharp(img.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${imageName}`);

    req.body.images.push(imageName);
  });

  await Promise.all(tratedImages);
  next();
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

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
