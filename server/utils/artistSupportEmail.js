import Artist from '../models/Artist/Artist.js';
import User from '../models/User/User.js';
import Song from '../models/Artist/Song.js';
import sendEmail from './emailTransportation.js';

const formatSupportAmount = (amount, currency = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
  }).format((Number(amount) || 0) / 100);

export async function sendArtistSupportReceivedEmail(support) {
  try {
    const [artist, supporter, song] = await Promise.all([
      Artist.findById(support.artistId).select('email fullName artistAka').lean(),
      User.findById(support.userId).select('username email').lean(),
      Song.findById(support.songId).select('title').lean(),
    ]);

    if (!artist?.email) {
      console.warn('Artist support email skipped: artist email missing', String(support.artistId));
      return;
    }

    const artistName = artist.artistAka || artist.fullName || 'there';
    const supporterName = supporter?.username || supporter?.email || 'A fan';
    const songTitle = song?.title || 'your song';
    const artistAmount = formatSupportAmount(support.artistAmount, support.currency);
    const grossAmount = formatSupportAmount(support.grossAmount, support.currency);

    await sendEmail(
      artist.email,
      `You received fan support for ${songTitle}`,
      `
        <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #171717;">
          <h2 style="margin: 0 0 12px;">Fan support received</h2>
          <p>Hi ${artistName},</p>
          <p>${supporterName} supported <strong>${songTitle}</strong>.</p>
          <p>
            Confirmed support amount: <strong>${grossAmount}</strong><br/>
            Your artist share: <strong>${artistAmount}</strong>
          </p>
          <p>You can view this in your artist dashboard under Fan support.</p>
        </div>
      `
    );
  } catch (error) {
    console.warn('Artist support email failed:', error?.message || error);
  }
}
