import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();




const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM || emailUser || "info@afrofeel.com";

if (!emailUser || !emailPass) {
  console.error("Email transport not configured: set EMAIL_USER and EMAIL_PASS.");
}

const transporter = nodemailer.createTransport({
  service: 'custom',
  host: 'smtp.privateemail.com',
  port: 465, // Use 465 for SSL or 587 for TLS
  secure: true, // Set to true for SSL
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

if (emailUser && emailPass) {
  transporter.verify()
    .then(() => {
      console.log("Email transport ready.");
    })
    .catch((error) => {
      console.error("Email transport verify failed:", {
        message: error?.message,
        code: error?.code,
        response: error?.response,
      });
    });
}

async function sendEmail(to, subject, html) {
  if (!emailUser || !emailPass) {
    throw new Error("Email transport not configured: missing EMAIL_USER/EMAIL_PASS.");
  }

  try {
    console.log("Sending email:", { to, subject });
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html,
    });
    return info;
  } catch (error) {
    console.error("Email send failed:", {
      message: error?.message,
      code: error?.code,
      response: error?.response,
    });
    throw error;
  }
}


export default sendEmail;
