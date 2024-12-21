import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();




const transporter = nodemailer.createTransport({
  service: 'custom', 
  host: 'smtp.privateemail.com', 
  port: 465, // Use 465 for SSL or 587 for TLS
  secure: true,  // Set to true for SSL
  auth: {
    user: process.env.EMAIL_USER,  // Your email address (e.g., info@afrofeel.com)
    pass: process.env.EMAIL_PASS,  // Your email password
  },
});

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: 'info@afrofeel.com',
    to,
    subject,
    html,
  });
}


export default sendEmail;
