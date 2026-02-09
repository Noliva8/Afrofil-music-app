import express from 'express';
import sendEmail from '../utils/emailTransportation.js';

const router = express.Router();

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ||
  process.env.EMAIL_USER ||
  'support@afrofeel.com';
const SUPPORT_NAME = process.env.SUPPORT_NAME || 'Afrofeel Support';

const createSupportHtml = ({ name, email, category, message, ip }) => `
  <h2>New support request</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Category:</strong> ${category}</p>
  <p><strong>Submitted at:</strong> ${new Date().toISOString()}</p>
  ${ip ? `<p><strong>IP:</strong> ${ip}</p>` : ''}
  <hr>
  <p>${message.replace(/\n/g, '<br>')}</p>
`;

const createAcknowledgementHtml = ({ name, category }) => `
  <h2>Thanks for reaching out, ${name}!</h2>
  <p>
    We received your ${category} request and our support team will follow up within 24 hours.
  </p>
  <p>If you need urgent help, just reply to this email or email ${SUPPORT_EMAIL}.
  </p>
`;

router.post('/', async (req, res) => {
  const { name, email, category = 'general', message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  try {
    const normalizedCategory = String(category).trim().toLowerCase();
    await sendEmail(
      SUPPORT_EMAIL,
      `[Afrofeel][Support] ${name} (${normalizedCategory})`,
      createSupportHtml({ name, email, category: normalizedCategory, message, ip: req.ip })
    );

    try {
      await sendEmail(
        email,
        `We received your support request`,
        createAcknowledgementHtml({ name, category: normalizedCategory })
      );
    } catch (ackErr) {
      console.warn('Failed to send acknowledgement:', ackErr?.message ?? ackErr);
    }

    return res.json({ success: true, message: 'Support request submitted.' });
  } catch (error) {
    console.error('Support route failed:', error);
    return res.status(500).json({ error: 'Failed to send support request. Please try again later.' });
  }
});

export default router;
