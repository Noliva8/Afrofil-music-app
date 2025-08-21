
import express from 'express';
import { Advertizer } from "../models/Advertizer/index_advertizer.js"
import path from 'path';
import { fileURLToPath } from 'url';


const router = express.Router();



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/verify-advertizer-email', async (req, res) => {
  console.log("🎯 Route hit"); 
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('❌ Missing verification token.');
  }

  try {
    const advertizer = await Advertizer.findOne({ confirmationToken: token });

    if (!advertizer) {
      return res.status(404).send('❌ Invalid or expired token.');
    }

    // ✅ CASE 2: Already verified
    if (advertizer.isConfirmed) {
      return res.redirect(`http://localhost:3003/verify-email?status=already`);
    }

    // ❌ CASE 3: Expired
    if (advertizer.confirmationTokenExpire < Date.now()) {
      return res.redirect(`http://localhost:3003/resend-email-verification-link?email=${encodeURIComponent(advertizer.businessEmail)}`);
    }

    // ✅ CASE 1: Valid and fresh
    advertizer.isConfirmed = true;
    advertizer.confirmationToken = undefined;
    advertizer.confirmationTokenExpire = undefined;
    await advertizer.save();

    return res.redirect(`http://localhost:3003/verify-email?status=verified`);
  } catch (err) {
    console.error(err);
    res.status(500).send('🚨 Server error.');
  }
});

export default router;



