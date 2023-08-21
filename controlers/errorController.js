const AppError = require('./../utils/appError');

//ERROR HANDLING START
const handelCastErrorDB = err => {
  const message = `Invalide ${err.path}: ${err.value}`;
  return new AppError(400, message);
  //400 bad request
};

const handelDuplicateFieldDB = err => {
  console.log(err);
  // const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const [[key, value]] = Object.entries(err.keyValue);
  const message = `Duplicate field value "${key} : ${value}" please use auther value`;
  return new AppError(400, message);
};

const handelValidationErrorDB = err => {
  const { message } = err;
  return new AppError(400, message);
};

const handelJsonWebTokenError = err =>
  new AppError(401, `${err.message}, please log in again!!`);

const handelTokenExpiredError = err =>
  new AppError(401, `${err.message}, At ${err.expiredAt}`);
//ERROR HANDLING EDN
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Error 😢',
      message: err.message
    });
  }
};
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // OPERATIONEL ERR
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // UNKNOWN ERR
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong'
      });
    }
  } else {
    // eslint-disable-next-line no-lonely-if
    if (err.isOperational) {
      // OPERATIONEL
      res.status(err.statusCode).render('error', {
        title: 'Error 😢',
        message: err.message
      });
    } else {
      // UNKNWON ERR
      res.status(err.statusCode).render('error', {
        title: 'Error 😢',
        message: 'try again later'
      });
    }
  }
};

//this func in a global error handler it starts with err param (err, req, res, next)
module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || '500';
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development' && err) {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = { ...err };
    let error = JSON.parse(JSON.stringify(err));
    error.message = err.message;
    if (error.name === 'CastError') error = handelCastErrorDB(error);
    if (error.code === 11000) error = handelDuplicateFieldDB(error);
    if (error.name === 'ValidationError')
      error = handelValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError')
      error = handelJsonWebTokenError(error);
    if (error.name === 'TokenExpiredError')
      error = handelTokenExpiredError(error);
    sendErrorProd(error, req, res);
  }
  next();
};
