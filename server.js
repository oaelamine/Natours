const mongoose = require('mongoose');

//envierment variable
const dotenv = require('dotenv');

//hadling exception ( error thet come from sync code)
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION');
  console.log(err.name, err.message);
  process.exit(1); //NOT OPTIONAL
});

//get the env variable from the .config file an set them to the process.env
dotenv.config({ path: './config.env' });

const app = require('./app');

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
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log(`DATA BASE CONNECTED .......!!`));

//STARTING THE SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`SERVER STARTED........${port}`);
});

process.on('unhandledRejection', err => {
  console.log('UNHADLED REJECTION PROMESS');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); //optional
  });
});
