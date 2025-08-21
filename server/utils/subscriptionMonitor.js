
import cron from 'node-cron';
import User from '../models/User/User.js';
import sendEmail from './emailTransportation.js';

const monitorSubscriptions = () => {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Checking for overdue subscriptions...');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const usersToDowngrade = await User.find({
      role: 'premium',
      'subscription.status': 'past_due',
      'subscription.periodEnd': { $lte: sevenDaysAgo },
    });

    for (const user of usersToDowngrade) {
      user.role = 'regular';
      user.subscription.status = 'past_due';
      await user.save();

      await sendEmail(
        user.email,
        'AfroFeel Premium Downgraded',
        `<p>Hi ${user.username},</p>
         <p>Your payment hasn't gone through for over 7 days. Your account has been switched to a regular plan.</p>
         <p>You can resubscribe anytime.</p>
         <p>– AfroFeel Team 🎵</p>`
      );

      console.log(`🔻 Downgraded ${user.email} due to failed payment`);
    }
  });
};

export default monitorSubscriptions;
