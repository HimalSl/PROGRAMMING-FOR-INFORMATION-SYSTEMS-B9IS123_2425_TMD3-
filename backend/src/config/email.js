// Import the nodemailer library for sending emails
const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport with gmail service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
         // Authentication credentials for the email account
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = transporter;