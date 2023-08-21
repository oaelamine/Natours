const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const APIfeaturs = require('./../utils/apiFeaturs');

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError(404, 'no document found with this ID'));
    }
    res.status(204).json({
      status: 'deleted',
      data: null
    });
  });
};

exports.createOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(200).json({
      status: 'success',
      data: doc
    });
  });
};

exports.updateOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError(404, 'no document found with this ID'));
    }

    res.status(500).json({
      status: 'updated',
      data: {
        data: doc
      }
    });
  });
};

exports.getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    // const doc = await Model.findById(req.params.id).populate(populateOption);
    let query = Model.findById(req.params.id);

    if (populateOption) query = query.populate(populateOption);

    const doc = await query;

    if (!doc) {
      next(new AppError(404, 'no toure found with this ID'));
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //this code is for nested GET endpoint
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //AWAITING THE RESULT AFTER ADDING ALL THE QUERY PARAMETTER THAT WE WANT'S (NEEDS TO BEE THE LAST STEP)
    const features = new APIfeaturs(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
