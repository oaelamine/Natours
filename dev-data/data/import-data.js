const fs = require('fs');

const dotenv = require('dotenv');

const mongoose = require('mongoose');

const Tour = require('./../../models/tourModel');
const Users = require('./../../models/userModel');
// const Reviews = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });

//CONNECTING THE DB
const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABSE_PASSWORD
);

//CONNECTING TO THE REMOTE DB
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DATA BASE CONNECTED .......!!'))
  .catch(err => {
    throw err;
  });

//READ THE FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
// const reviews = JSON.parse(
//   fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
// );

const importDate = async () => {
  try {
    await Tour.create(tours);
    await Users.create(users, { validateBeforeSave: false });
    // await Reviews.create(reviews);
    console.log('DATA IMPORTED');
  } catch (error) {
    console.log(error);
  }
};
const deletaData = async () => {
  try {
    await Tour.deleteMany();
    await Users.deleteMany();
    // await Reviews.deleteMany();
    console.log('DATA DELETED');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === '--import') {
  importDate();
} else if (process.argv[2] === '--delete') {
  deletaData();
}
