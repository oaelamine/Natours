// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) create the transport
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  // 2) Define eamil option
  const mailOption = {
    from: 'Ouraghi Amine <sseflawi2@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //html
  };
  // 3) Send the email
  await transport.sendMail(mailOption);
};

module.exports = sendEmail;
