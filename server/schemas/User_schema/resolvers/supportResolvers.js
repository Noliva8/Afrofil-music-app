import sendEmail from '../../../utils/emailTransportation.js';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@afrofeel.com';
const SUPPORT_NAME = process.env.SUPPORT_NAME || 'Afrofeel Support';

const createSupportHtml = ({ name, email, category, message }) => `
  <h2>New support request</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Category:</strong> ${category}</p>
  <p><strong>Submitted at:</strong> ${new Date().toISOString()}</p>
  <hr>
  <p>${message.replace(/\n/g, '<br>')}</p>
`;

const createAcknowledgementHtml = ({ name, category }) => `
  <h2>Thanks for reaching out, ${name}!</h2>
  <p>
    We received your ${category} request and our support team will follow up within 24 hours.
  </p>
  <p>If you need urgent help, reply to this email or contact ${SUPPORT_EMAIL}.</p>
`;

export const sendSupportMessage = async (_parent, { input }) => {
  const { name, email, category = 'general', message } = input;

  await sendEmail(
    SUPPORT_EMAIL,
    `[Afrofeel Support] ${name} (${category})`,
    createSupportHtml({ name, email, category, message })
  );

  await sendEmail(
    email,
    'We received your Afrofeel support request',
    createAcknowledgementHtml({ name, category })
  );

  return {
    success: true,
    message: 'Support request submitted. We will reply shortly.'
  };
};
