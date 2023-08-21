const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// eslint-disable-next-line import/no-extraneous-dependencies
const helmet = require('helmet');
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoSanitize = require('express-mongo-sanitize');
// eslint-disable-next-line import/no-extraneous-dependencies
const xss = require('xss-clean');
// eslint-disable-next-line import/no-extraneous-dependencies
const hpp = require('hpp');

// eslint-disable-next-line import/no-extraneous-dependencies
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const toursRoute = require('./routes/toursRoutes');
const usersRoute = require('./routes/usersRoutes');
const reviewRoute = require('./routes/reviewRoutes');
const viewRoute = require('./routes/viewRoutes');
const errorHandler = require('./controlers/errorController');

const app = express();

//set the view engin
app.set('view engine', 'pug');
//spesify the folder that contains our tempaltes
app.set('views', path.join(__dirname, 'views'));

//GLOBAL MIDDELWEAR
//serving static files
app.use(express.static(`${__dirname}/public`));

//security http header
app.use(helmet());

//developpement logging
if (process.env.NODE_ENV === 'development') {
  //process.env is a node.js feahcur
  app.use(morgan('dev')); //used to display the request data in the console
  //GET /api/v1/tours/6480c1ab0fdf7420c0f31d11 404 163.645 ms - 57
}

//limit requiest from the same API
const limiter = rateLimit({
  max: 100, //how meny request are allowed by the same IP
  windowMs: 60 * 60 * 1000, // 100 request by hour (windowMs) Ms = mille secends,
  message: 'To meny request for he same IP, try again in one hour'
});
app.use('/api', limiter);

//req.body parcer
// the limit option limit the size of the data send in the body
app.use(express.json({ limit: '10kb' })); // this middelware allow us to parse data req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); //this allow us to parse data frm cookies

//Data Sanitization
// 1) Data Sanitization aginst NoSQL query ingection
app.use(mongoSanitize());

// 2) Data Sanitization aginst XSS (cross side scripting)
// clean the user input from HTML code
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use((req, res, next) => {
  req.time = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

//Routes

app.use('/', viewRoute);
app.use('/api/v1/tours', toursRoute);
app.use('/api/v1/users', usersRoute);
app.use('/api/v1/reviews', reviewRoute);

//Handler for undefuned routs
app.all('*', (req, res, next) => {
  const message = `this route ${req.originalUrl} is not handled from the CLASS and errorController errorHandler`;
  const err = new AppError(500, message);
  next(err);
});

//ERROR HANDLING MIDELWEAR
app.use(errorHandler);
module.exports = app;
