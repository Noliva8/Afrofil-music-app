import { Artist } from '../models/Artist/index_artist.js';

const OLD_SONG_OF_THE_WEEK_WINNERS = [
  {
    id: '69faec30d9ac898c11bf4282',
    email: 'nyiraeleda2021@gmail.com',
    artistAka: 'Eleda',
    wonAt: '2026-08-21T23:59:59.999Z',
  },
  {
    id: '69fb4643d9ac898c11bf53d4',
    email: 'bakunzichristine3@gmail.com',
    artistAka: 'Mabosi',
    wonAt: '2026-08-28T23:59:59.999Z',
  },
];

const getBackfillWonAt = (winner) => {
  const parsedDate = winner?.wonAt ? new Date(winner.wonAt) : null;

  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return new Date();
};

const hasOwnField = (doc, field) => Object.prototype.hasOwnProperty.call(doc || {}, field);

let oldWinnerUpdatePromise = null;
let oldWinnerUpdateResults = null;

const getMissingSongOfTheWeekFieldUpdates = (artist, wonAt) => {
  const $set = {};

  if (!hasOwnField(artist, 'songOfTheWeekGrandPrizeWonAt') || !artist.songOfTheWeekGrandPrizeWonAt) {
    $set.songOfTheWeekGrandPrizeWonAt = wonAt;
  }

  if (
    !hasOwnField(artist, 'songOfTheWeekRepeatWinCount') ||
    Number(artist.songOfTheWeekRepeatWinCount || 0) < 1
  ) {
    $set.songOfTheWeekRepeatWinCount = 1;
  }

  if (!hasOwnField(artist, 'songOfTheWeekArtistBlockedUntil')) {
    $set.songOfTheWeekArtistBlockedUntil = null;
  }

  return $set;
};

const runOldSongOfTheWeekWinnerUpdate = async () => {
  const results = [];

  for (const winner of OLD_SONG_OF_THE_WEEK_WINNERS) {
    const wonAt = getBackfillWonAt(winner);
    const artist = await Artist.findOne({
      $or: [
        { _id: winner.id },
        { email: winner.email },
      ],
    }).select(
      '_id fullName artistAka email songOfTheWeekGrandPrizeWonAt songOfTheWeekRepeatWinCount songOfTheWeekArtistBlockedUntil'
    ).lean();

    if (!artist) {
      results.push({
        id: winner.id,
        email: winner.email,
        artistAka: winner.artistAka,
        status: 'not_found',
      });
      continue;
    }

    const $set = getMissingSongOfTheWeekFieldUpdates(artist, wonAt);

    if (Object.keys($set).length === 0) {
      results.push({
        id: String(artist._id),
        email: artist.email,
        artistAka: artist.artistAka,
        status: 'already_updated',
        songOfTheWeekGrandPrizeWonAt: artist.songOfTheWeekGrandPrizeWonAt,
        songOfTheWeekRepeatWinCount: artist.songOfTheWeekRepeatWinCount,
        songOfTheWeekArtistBlockedUntil: artist.songOfTheWeekArtistBlockedUntil,
      });
      continue;
    }

    const updatedArtist = await Artist.findByIdAndUpdate(
      artist._id,
      { $set },
      { new: true, runValidators: true }
    ).select(
      '_id fullName artistAka email songOfTheWeekGrandPrizeWonAt songOfTheWeekRepeatWinCount songOfTheWeekArtistBlockedUntil'
    ).lean();

    results.push({
      id: String(updatedArtist._id),
      email: updatedArtist.email,
      artistAka: updatedArtist.artistAka,
      status: 'updated',
      updatedFields: Object.keys($set),
      songOfTheWeekGrandPrizeWonAt: updatedArtist.songOfTheWeekGrandPrizeWonAt,
      songOfTheWeekRepeatWinCount: updatedArtist.songOfTheWeekRepeatWinCount,
      songOfTheWeekArtistBlockedUntil: updatedArtist.songOfTheWeekArtistBlockedUntil,
    });
  }

  const foundCount = results.filter((result) => result.status !== 'not_found').length;
  const updatedCount = results.filter((result) => result.status === 'updated').length;

  if (foundCount === 0) {
    console.warn('[oldWinnerUpdate] No matching old Song of the Week winners found. Nothing was updated:', results);
  } else if (updatedCount === 0) {
    console.log('[oldWinnerUpdate] Old Song of the Week winners already aligned:', results);
  } else {
    console.log('[oldWinnerUpdate] Old Song of the Week winner backfill updated artists:', results);
  }

  return results;
};

export const updateOldSongOfTheWeekWinners = async () => {
  if (oldWinnerUpdateResults) return oldWinnerUpdateResults;
  if (!oldWinnerUpdatePromise) {
    oldWinnerUpdatePromise = runOldSongOfTheWeekWinnerUpdate().then((results) => {
      oldWinnerUpdateResults = results;
      return results;
    });
  }

  return oldWinnerUpdatePromise;
};

export default updateOldSongOfTheWeekWinners;
