
import {  Album, Artist, BookArtist, Message } from '../../models/Artist/index_artist.js'
import { User, Playlist, Comment, LikedSongs, PlayCount, Song, UserNotification } from '../../models/User/user_index.js'

import {   AuthenticationError} from '../../utils/user_auth.js';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { detectUserLocation } from './OtherResorvers/detectUserLocation.js';
import { createSongRedis, redisTrending } from '../Artist_schema/Redis/songCreateRedis.js';
import { toggleLikeSong } from './OtherResorvers/toggleLikeSong.js';

import {USER_TYPES} from '../../utils/AuthSystem/constant/systemRoles.js'
import {signUserToken } from '../../utils/AuthSystem/tokenUtils.js';
import { addSongRedis } from '../Artist_schema/Redis/addSongRedis.js';
import { RECENT_PLAYED_CACHE_KEY, songKey } from '../Artist_schema/Redis/keys.js';
import { getRedis } from '../../utils/AdEngine/redis/redisClient.js';
import sendEmail from '../../utils/emailTransportation.js';
import { buildDailyMix } from '../../utils/aiMixService.js';
import { markSeenUserNotification } from '../Artist_schema/MessagingSystem/Notifications/Users/markSeenUserNotification.js';

import { notificationOnArtistMessages } from '../Artist_schema/MessagingSystem/Notifications/Users/notificationOnArtistMessages.js';

import { notificationOnCreatedBookings } from '../Artist_schema/MessagingSystem/Notifications/Users/notificationOnCreatedBookings.js';
import { sendSupportMessage } from './resolvers/supportResolvers.js';
import { attachVisitorToUser, startVisitorVisit, visitorAnalyticsStats } from './resolvers/visitorAnalytics.js';




const normalizeString = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const incrementCounts = (counts, values) => {
  values.forEach((value) => {
    const normalized = normalizeString(value);
    if (!normalized) return;
    counts[normalized] = counts[normalized] || { label: value, count: 0 };
    counts[normalized].count += 1;
    if (!counts[normalized].label) {
      counts[normalized].label = value;
    }
  });
};

const pickTopValues = (counts, limit = 3) => {
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => entry.label)
    .filter(Boolean);
};

const pickFirstValue = (counts) => {
  return (
    Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map((entry) => entry.label)
      .find(Boolean) || null
  );
};

const flattenSongs = (docs, field) =>
  docs.flatMap((doc) => {
    const values = Array.isArray(doc[field]) ? doc[field] : [];
    return values.filter(Boolean);
  });

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const generatePhoneVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));
const generateUserEmailVerificationCode = () => String(Math.floor(1000 + Math.random() * 9000));
const RECENT_PLAYED_CACHE_TTL_SECONDS = 15 * 60;
const USER_PASSWORD_RULE_MESSAGE = 'Password must be at least 8 characters and include letters and numbers';

const isValidUserPassword = (password) =>
  typeof password === 'string' &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

const hasLegacyArtistProfileFields = (artist) =>
  Boolean(
    artist?.fullName &&
    artist?.artistAka &&
    artist?.email &&
    artist?.country &&
    artist?.region
  );

const ensureUserForLegacyArtistLogin = async ({ artist, password }) => {
  if (!artist?.confirmed || !artist?.selectedPlan || !hasLegacyArtistProfileFields(artist)) {
    return null;
  }

  if (!artist.isProfileComplete) {
    artist.isProfileComplete = true;
    await artist.save();
  }

  const normalizedEmail = normalizeEmail(artist.email);
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    if (!user.isUserEmailVerified) {
      user.isUserEmailVerified = true;
      await user.save();
    }
    return user;
  }

  const usernameSeed = String(artist.artistAka || artist.fullName || normalizedEmail.split('@')[0])
    .trim()
    .replace(/\s+/g, ' ');
  const username = (usernameSeed.length >= 3 ? usernameSeed : `${usernameSeed || 'artist'} user`).slice(0, 30);

  return User.create({
    username,
    email: normalizedEmail,
    password,
    role: 'regular',
    usageType: 'personal',
    isUserEmailVerified: true,
    subscription: {
      status: 'none',
      periodEnd: null,
      planId: null,
    },
    adLimits: {
      skipsAllowed: 5,
      lastReset: new Date(),
    },
  });
};

const sendBusinessVerificationEmail = (email, verificationCode) => {
  sendEmail(
    email,
    'Verify your FloLup business email',
    `
      <p>Your FloLup business email verification code is:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${verificationCode}</p>
      <p>This code is valid for 10 minutes.</p>
    `
  ).catch((error) => {
    console.error('Business email verification send failed:', error?.message || error);
  });
};

const sendUserVerificationEmail = (email, verificationCode) => {
  sendEmail(
    email,
    'Verify your FloLup email',
    `
      <p>Your FloLup email verification code is:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${verificationCode}</p>
      <p>This code is valid for 10 minutes.</p>
    `
  ).catch((error) => {
    console.error('User email verification send failed:', error?.message || error);
  });
};

const buildEmailVerificationResponse = ({ message, expiresAt, success = true }) => {
  const expiryTime = expiresAt ? new Date(expiresAt).getTime() : 0;
  const secondsRemaining = Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));

  return {
    success,
    message,
    expiresAt: secondsRemaining > 0 ? new Date(expiresAt) : null,
    secondsRemaining,
    canResend: secondsRemaining <= 0,
  };
};

const buildUserAuthPayload = (user) => {
  const isPremium = user.role === 'premium' &&
    user.subscription?.status === 'active' &&
    (!user.subscription?.periodEnd || new Date(user.subscription.periodEnd) > new Date());

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    usageType: user.usageType,
    isUserEmailVerified: user.isUserEmailVerified,
    isUserBusinessPhoneVerified: user.isUserBusinessPhoneVerified,
    isBusinessProfileComplete: user.isBusinessProfileComplete,
    businessProfile: user.businessProfile,
    isPremium,
    shouldSeeAds: !isPremium,
    canSkipAd: isPremium || (user.adLimits?.skipsAllowed > 0),
    subscription: user.subscription,
    adLimits: user.adLimits,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};



const buildMixProfileFromSongs = (songs, userDoc) => {
  const moodCounts = {};
  const subMoodCounts = {};
  const genreCounts = {};
  const keyCounts = {};
  const modeCounts = {};
  let tempoSum = 0;
  let tempoCount = 0;

  songs.forEach((song) => {
    incrementCounts(moodCounts, ensureArray(song.mood));
    incrementCounts(subMoodCounts, ensureArray(song.subMoods));

    const genres = ensureArray(song.genre).map((genre) =>
      typeof genre === "object" ? genre?.name : genre
    );
    incrementCounts(genreCounts, genres);

    if (song.key) {
      incrementCounts(keyCounts, [song.key]);
    }
    if (typeof song.mode === "number") {
      incrementCounts(modeCounts, [song.mode]);
    }
    if (typeof song.tempo === "number" && !Number.isNaN(song.tempo)) {
      tempoSum += song.tempo;
      tempoCount += 1;
    } else if (typeof song.tempo === "string" && !Number.isNaN(Number(song.tempo))) {
      const tempoValue = Number(song.tempo);
      tempoSum += tempoValue;
      tempoCount += 1;
    }
  });

  const avgTempo = tempoCount ? tempoSum / tempoCount : null;

  const tempoRange =
    avgTempo !== null
      ? {
          min: Math.max(avgTempo - 10, 20),
          max: avgTempo + 10,
        }
      : null;

  return {
    moods: pickTopValues(moodCounts, 3),
    subMoods: pickTopValues(subMoodCounts, 4),
    genres: pickTopValues(genreCounts, 3),
    tempoRange,
    key: pickFirstValue(keyCounts),
    mode: pickFirstValue(modeCounts),
    location: userDoc?.location || null,
  };
};

const gatherSongsFromUser = async (userId) => {
  const [playDocs, likedDoc, playlists] = await Promise.all([
    PlayCount.find({ user: userId }).sort({ createdAt: -1 }).limit(20).populate("played_songs"),
    LikedSongs.findOne({ user: userId }).populate("liked_songs"),
    Playlist.find({ createdBy: userId }).populate("songs"),
  ]);

  const playedSongs = playDocs.flatMap((play) => ensureArray(play.played_songs));
  const likedSongs = ensureArray(likedDoc?.liked_songs);
  const playlistSongs = playlists.flatMap((pl) => ensureArray(pl.songs));

  const combined = [...playedSongs, ...likedSongs, ...playlistSongs];
  const deduped = Array.from(
    new Map(combined.map((song) => [String(song?._id ?? song?.id ?? Math.random()), song])).values()
  ).filter(Boolean);

  return deduped;
};

const buildUserMixProfile = async (userId, userDoc) => {
  if (!userId) return null;

  const songs = await gatherSongsFromUser(userId);
  if (!songs.length) return null;

  return buildMixProfileFromSongs(songs, userDoc);
};




// Helper function to determine if song should be cached
function shouldCacheSong(song) {
  return (
    song.playCount > 100 ||        // Already popular
    song.releaseDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) || // New release
    song.isFeatured ||             // Featured song
    song.artist?.isPopular         // Popular artist
  );
}

const resolvers = {

  Query: {

   users: async () => {
  try {
    const userData = await User.find({});
    return userData;
  } catch (error) {
    console.error("Error occurred during user data fetching:", error);
    throw new Error("Could not fetch user data");
  }
},



playlists: async () => {
  try {
    const playlistData = await Playlist.find({})
      .populate('songs') 
      .populate('createdBy'); 
    return playlistData;

  } catch (error) {
    console.error("Error occurred during playlist data fetching:", error);
    throw new Error("Could not fetch playlist data");
  }
},
// --------------------------------------------------------------------------

comments: async () => {
  try{
    const commentData = await Comment.find({})
    .populate('user')
    .populate('song')
    .sort({ createdAt: -1 })
    return commentData;
  }catch(error){
 console.error("Error occurred during comments data fetching:", error);
    throw new Error("Could not fetch comments data");
  }
},

// --------------------------------------------------------------------------

// PART 2: SINGLE QUERY

searchUser: async (parent, { username }) => {
  try{
     const user = await User.findOne({ username })
  .select('likedSongs playCounts') 
  .populate('likedSongs');

    if (!user) {
      throw new Error(`User with username ${username} not found`);
    }
   return user

  }catch(error){
 console.error("Error occurred during user by username data fetching:", error);
    throw new Error("unable to fetch user by his username");
  }
    }, 

    // --------------------------------------------------------------------------

userById: async (parent, { userId }) => {
  try {
    const user = await User.findById({_id: userId})
      .populate('following');
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
},

businessAccountStatus: async (_, { email }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new GraphQLError('Email is required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  const user = await User.findOne({ email: normalizedEmail }).select('email usageType isUserEmailVerified isBusinessProfileComplete businessProfile.businessName businessProfile.businessType').lean();
  const usageTypes = Array.isArray(user?.usageType) ? user.usageType : [user?.usageType].filter(Boolean);
  const hasBusinessUsage = usageTypes.includes('business');

  return {
    exists: Boolean(user),
    email: normalizedEmail,
    usageType: user?.usageType || null,
    hasBusinessUsage,
    isUserEmailVerified: Boolean(user?.isUserEmailVerified),
    isBusinessProfileComplete: Boolean(user?.isBusinessProfileComplete),
    businessName: user?.businessProfile?.businessName || null,
    businessType: user?.businessProfile?.businessType || null
  };
},

userEmailVerificationStatus: async (_, { email }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new GraphQLError('Email is required', {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  const user = await User.findOne({ email: normalizedEmail })
    .select('isUserEmailVerified +userEmailVerificationCode +userEmailVerificationExpires')
    .lean();

  if (!user) {
    throw new GraphQLError('User not found', {
      extensions: { code: 'NOT_FOUND' }
    });
  }

  if (user.isUserEmailVerified) {
    return buildEmailVerificationResponse({
      message: 'Email is already verified.',
      expiresAt: null,
    });
  }

  if (!user.userEmailVerificationCode || !user.userEmailVerificationExpires) {
    return buildEmailVerificationResponse({
      message: 'No active verification code. Request a new code.',
      expiresAt: null,
    });
  }

  return buildEmailVerificationResponse({
    message: 'Verification code is still valid.',
    expiresAt: user.userEmailVerificationExpires,
  });
},

    userSubscription: async (_, __, { user }) => {
      if (!user?._id) {
        throw new AuthenticationError('You must be logged in to view your subscription.');
      }

      const freshUser = await User.findById(user._id).select('subscription');
      if (!freshUser) {
        throw new GraphQLError('Unable to locate your account.');
      }

      const subs = freshUser.subscription || {
        status: 'none',
        planId: null,
        periodEnd: null,
      };
      return {
        ...subs,
        status: subs.status?.toUpperCase?.() || 'NONE',
      };
    },



    dailyMix: async (_parent, { profileInput, limit = 20 }, { user }) => {
      try {
        let userContext = profileInput || null;
        if (!userContext && user?._id) {
          const userDoc = await User.findById(user._id).select("location");
          userContext = await buildUserMixProfile(user._id, userDoc || user);
        }
        const mix = await buildDailyMix({ userContext, limit });

    
        return mix;
      } catch (error) {
        console.error('Failed to resolve daily mix, returning fallback:', error);
        return {
          profileKey: 'fallback',
          profileLabel: 'Daily mix temporarily unavailable',
          profile: null,
          tracks: [],
          generatedAt: new Date().toISOString(),
          userContext: profileInput || null,
        };
      }
    },



recentPlayedSongs: async (_, { limit = 50 }, { user }) => {
  if (!user?._id) {
    throw new AuthenticationError('You must be logged in!');
  }

  const requested = Math.max(1, Math.min(Number(limit) || 50, 50));
  const cacheKey = RECENT_PLAYED_CACHE_KEY(user._id, requested);
  let redis = null;

  try {
    redis = await getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    redis = null;
    console.warn('Recent played cache read failed:', error?.message || error);
  }

  const plays = await PlayCount.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(requested)
    .populate({
      path: 'played_songs',
      populate: [
        {
          path: 'artist',
          select:
            'artistAka country bio artistDownloadCounts profileImage bookingAvailability',
        },
        { path: 'album', select: 'title releaseDate albumCoverImage' },
      ],
    })
    .lean();

  const recentSongs = plays
    .map((play) => play.played_songs)
    .filter(Boolean)
    .map((song) => ({
      ...song,
      artistFollowers: 0,
      mood: song.mood || [],
      subMoods: song.subMoods || [],
      composer: Array.isArray(song.composer) ? song.composer : [],
      producer: Array.isArray(song.producer) ? song.producer : [],
      likesCount: song.likedByUsers?.length || song.likesCount || 0,
      downloadCount: song.downloadCount || 0,
      playCount: song.playCount || 0,
      shareCount: song.shareCount || 0,
      artistDownloadCounts: Number(song.artist?.artistDownloadCounts || 0),
    }));

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(recentSongs), {
        EX: RECENT_PLAYED_CACHE_TTL_SECONDS,
      });
    } catch (error) {
      console.warn('Recent played cache write failed:', error?.message || error);
    }
  }

  return recentSongs;
},

likedSongs: async (_, { limit = 50 }, { user }) => {
  if (!user?._id) {
    throw new AuthenticationError('You must be logged in!');
  }

  const likes = await LikedSongs.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'liked_songs',
      populate: [
        {
          path: 'artist',
          select:
            'artistAka country bio artistDownloadCounts profileImage bookingAvailability',
        },
        { path: 'album', select: 'title releaseDate albumCoverImage' },
      ],
    })
    .lean();

  return likes
    .map((like) => like.liked_songs)
    .filter(Boolean)
    .map((song) => ({
      ...song,
      artistFollowers: 0,
      mood: song.mood || [],
      subMoods: song.subMoods || [],
      composer: Array.isArray(song.composer) ? song.composer : [],
      producer: Array.isArray(song.producer) ? song.producer : [],
      likesCount: song.likedByUsers?.length || song.likesCount || 0,
      downloadCount: song.downloadCount || 0,
      playCount: song.playCount || 0,
      shareCount: song.shareCount || 0,
      artistDownloadCounts: Number(song.artist?.artistDownloadCounts || 0),
}));
},


  userNotifications: async (_, { status }, { user }) => {

    if (!user?._id) {
      throw new AuthenticationError('You must be logged in!');
    }

    const query = {
      user: user._id,
      isChatEnabled: true,
    };

    if (status) {
      const normalizedStatus = status.toLowerCase();
      query.status = normalizedStatus === 'accepted' ? 'accepted' : 'declined';
    }

    let bookings;
    try {
      bookings = await BookArtist.find(query)
        .populate({ path: 'artist', select: 'artistAka profileImage' })
        .populate({ path: 'song', select: 'title' })
        .populate({ path: 'location' })
        .sort({ updatedAt: -1 })
        .lean();
    } catch (error) {
      console.error('booking notifications query failed', error);
      throw new GraphQLError('Failed to load booking notifications');
    }

    const normalizeEvent = (value) => {
      if (!value) return null;
      return String(value).trim().replace(/\s+/g, '_').toUpperCase();
    };

    return bookings.map((booking) => {
      const normalizedBooking = {
        ...booking,
        bookingId: booking._id,
        eventType: normalizeEvent(booking.eventType),
        performanceType: normalizeEvent(booking.performanceType),
        status: normalizeEvent(booking.status),
      };
      const type = (normalizedBooking.status || booking.status || 'PENDING').toUpperCase();

      return {
        _id: booking._id,
        bookingId: booking._id,
        bookingStatus: type,
        type,
        message: booking.message || booking.artistResponse?.message || '',
        isRead: true,
        isChatEnabled: booking.isChatEnabled,
        createdAt: booking.updatedAt,
        updatedAt: booking.updatedAt,
        booking: normalizedBooking,
      };
    });
  },

  notificationOnCreatedBookings: async (_parent, _args, { user }) => {
    if (!user?._id) {
      throw new AuthenticationError('You must be logged in to view notifications.');
    }

    const notifications = await UserNotification.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .lean();
    notifications.forEach((n) => {
      if (n.type) {
        n.type = String(n.type).toUpperCase();
      }
    });
    return notifications || [];
  },



userPlaylists: async (_, { limit = 50 }, { user }) => {
  if (!user?._id) {
    throw new AuthenticationError('You must be logged in!');
  }

  return Playlist.find({ createdBy: user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'songs',
      options: { limit: 50 },
      populate: [
        { path: 'artist', select: 'artistAka country bio followers artistDownloadCounts profileImage' },
        { path: 'album', select: 'title releaseDate albumCoverImage' },
      ],
    })
    .lean()
    .then((playlists) =>
      playlists.map((playlist) => ({
        ...playlist,
        songs: (playlist.songs || []).map((song) => ({
          ...song,
          artistFollowers: Array.isArray(song.artist?.followers) ? song.artist.followers.length : 0,
          mood: song.mood || [],
          subMoods: song.subMoods || [],
          composer: Array.isArray(song.composer) ? song.composer : [],
          producer: Array.isArray(song.producer) ? song.producer : [],
          likesCount: song.likedByUsers?.length || song.likesCount || 0,
          downloadCount: song.downloadCount || 0,
          playCount: song.playCount || 0,
          shareCount: song.shareCount || 0,
          artistDownloadCounts: Number(song.artist?.artistDownloadCounts || 0),
        })),
      }))
    );
},

// -----------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------



// Treding Songs
// ------------

// trendingSongs: async () => {

//   const limit = 20;

//   try {
//     // Fetch all song sets in parallel
//     const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//       Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit).populate('artist').populate('album'),

//       Song.aggregate([
//         {
//           $addFields: {
//             likesCount: { $size: { $ifNull: ["$likedByUsers", []] } }
//           }
//         },
//         { $sort: { likesCount: -1, createdAt: -1 } },
//         { $limit: limit }
//       ]),

//       Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit).populate('artist').populate('album'),

//       Song.find().sort({ createdAt: -1 }).limit(limit).populate('artist').populate('album')
//     ]);

//     // Populate artists for topLikesAgg results
//     const likedIds = topLikesAgg.map(song => song._id);
//     const topLikes = await Song.find({ _id: { $in: likedIds } }).populate('artist').populate('album');

//     // Merge them uniquely
//     const merged = [];
//     const seen = new Set();

//     const addUnique = (songs) => {
//       for (const song of songs) {
//         const id = song._id.toString();
//         if (!seen.has(id)) {
//           seen.add(id);
//           merged.push(song);
//           if (merged.length === limit) break;
//         }
//       }
//     };

//     addUnique(topPlays);
//     addUnique(topLikes);
//     addUnique(topDownloads);
//     addUnique(latestSongs);

   

//     return merged.slice(0, limit);
//   } catch (error) {
//     console.error("❌ Trending songs fetch error:", error);
//     return [];
//   }
// },




// trendingSongs: async () => {
//   const limit = 20;

//   // // 1) Try Redis first
//   // try {
//   //   const fromRedis = await redisTrending(limit);
//   //   if (fromRedis && fromRedis.length) {
//   //     return fromRedis;
//   //   }
//   // } catch (e) {
//   //   console.warn("[trendingSongs] Redis fetch failed, falling back:", e.message);
//   // }

//   // 2) DB fallback
//   try {
//     const [topPlays, topLikesAgg, topDownloads, latestSongs] = await Promise.all([
//       Song.find().sort({ playCount: -1, createdAt: -1 }).limit(limit)
//         .populate({path: 'artist', select: '-password -email -__v'}).populate({ path: 'album', populate: {
//       path: 'artist',
//       select: ' artistAka profileImage bio country genre languages coverImage' 
//     }}).lean(),



//       Song.aggregate([
//         { $addFields: { likesCount: { $size: { $ifNull: ['$likedByUsers', []] } } } },
//         { $sort: { likesCount: -1, createdAt: -1 } },
//         { $limit: limit }
//       ]),

//       Song.find().sort({ downloadCount: -1, createdAt: -1 }).limit(limit)
//         .populate('artist').populate('album').lean(),

//       Song.find().sort({ createdAt: -1 }).limit(limit)
//         .populate('artist').populate('album').lean(),
//     ]);





//     // Re-fetch liked with full docs
//     const likedIds = topLikesAgg.map(s => s._id);
//     const topLikes = await Song.find({ _id: { $in: likedIds } })
//       .populate('artist').populate('album').lean();

//     const merged = [];
//     const seen = new Set();

//     const addUnique = (songs) => {
//       for (const s of songs) {
//         const id = s._id.toString();
//         if (seen.has(id)) continue;

//         // ⚠️ Sanitize missing artist/album/title — allow song through
//         const artist = s.artist || null;
//         const album = s.album || null;
//         const albumTitle = album?.title || 'Unknown Album';

//         seen.add(id);
//         merged.push({
//           ...s,
//           artist,
//           album: album ? { ...album, title: albumTitle } : null,
//           likesCount: s.likedByUsers?.length || s.likesCount || 0,
//         });

//         if (merged.length === limit) break;
//       }
//     };

//     addUnique(topPlays);
//     addUnique(topLikes);
//     addUnique(topDownloads);
//     addUnique(latestSongs);

//     const result = merged.slice(0, limit);



//     // 3) Best-effort Redis backfill
//     (async () => {
//       try {
//         const r = await getRedis();
//         for (const doc of result) {
//           try {
//             await createSongRedis(doc);
//             if (typeof recomputeTrendingFor === "function") {
//               await recomputeTrendingFor(r, String(doc._id));
//             }
//           } catch (e) {
//             console.warn("[trendingSongs] backfill for", doc._id, "failed:", e.message);
//           }
//         }
//       } catch (e) {
//         console.warn("[trendingSongs] Redis backfill skipped:", e.message);
//       }
//     })();

//     return result;
//   } catch (err) {
//     console.error("❌ Trending songs DB fallback error:", err);
//     return [];
//   }
// },




// 
// ---------------------------------------------------------------------------------------




// -------------------------------------------------------------------------------------------




playlist: async (parent, { playlistId }) => {
  try {
    const playlist = await Playlist.findById({_id:playlistId})
      .populate('songs')
      .populate('user'); 

    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }
    return playlist;
  } catch (error) {
    throw new Error(error.message);
  }
},

commentsForSong: async (parent, { songId }) => {
  try {
    const comments = await Comment.find({ song: songId })
      .populate('user'); 

    if (comments.length === 0) {
      throw new Error(`No comments found for song with ID ${songId}`);
    }
    return comments;
  } catch (error) {
    throw new Error(error.message);
  }
},

	  notificationOnCreatedBookings,
	  notificationOnArtistMessages,
    visitorAnalyticsStats,
	 

	  },


  Mutation: {
    
	sendSupportMessage,
	     markSeenUserNotification,

       
      startVisitorVisit,
      attachVisitorToUser,


// Create a new user
createUser: async (_, { input }) => {
      try {
        const { username, email, password, role = 'regular', usageType = 'personal' } = input;

        // Validate input
        if (!username?.trim() || !email?.trim() || !password) {
          throw new GraphQLError('All fields are required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new GraphQLError('Invalid email format', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Validate password strength
        if (!isValidUserPassword(password)) {
          throw new GraphQLError(USER_PASSWORD_RULE_MESSAGE, {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }


        // Normalize role to lowercase
        const normalizedRole = role.toLowerCase(); 
        const normalizeUsageType = usageType.toLowerCase();
        const normalizedEmail = normalizeEmail(email);
        const verificationCode = generateUserEmailVerificationCode();

        // Check for existing non-artist user
        const existingUser = await User.findOne({
          email: normalizedEmail,
          role: { $ne: 'ARTIST' }
        }).lean();

        if (existingUser) {
          throw new GraphQLError('Email already in use by a regular/premium user', {
            extensions: { code: 'CONFLICT' }
          });
        }

         // Create user
        const newUser = await User.create({
          username: username.trim(),
          email: normalizedEmail,
          password,
          role: normalizedRole,
          usageType: normalizeUsageType,
          isUserEmailVerified: false,
          userEmailVerificationCode: verificationCode,
          userEmailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
          subscription: {
            status: 'none',
            periodEnd: normalizedRole === 'premium'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : null,
            planId: null
          },
          adLimits: {
            skipsAllowed: 5,
            lastReset: new Date()
          }
        });

           const token = signUserToken(newUser, USER_TYPES.USER);
           sendUserVerificationEmail(normalizedEmail, verificationCode);

        return {
          userToken: token,
          user: buildUserAuthPayload(newUser)
        };

      } catch (error) {
        console.error('User creation error:', error);

        if (error.code === 11000) {
          throw new GraphQLError('User already exists', {
            extensions: { code: 'CONFLICT' }
          });
        }

        if (error.extensions?.code) {
          throw error;
        }

        throw new GraphQLError('Failed to create user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

requestUserEmailVerification: async (_, { email }) => {
      try {
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select('+userEmailVerificationCode +userEmailVerificationExpires');

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        if (user.isUserEmailVerified) {
          return buildEmailVerificationResponse({
            message: 'Email is already verified.',
            expiresAt: null,
          });
        }

        if (user.userEmailVerificationCode && user.userEmailVerificationExpires > new Date()) {
          return buildEmailVerificationResponse({
            message: 'Your current verification code is still valid.',
            expiresAt: user.userEmailVerificationExpires,
          });
        }

        const verificationCode = generateUserEmailVerificationCode();
        user.userEmailVerificationCode = verificationCode;
        user.userEmailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        sendUserVerificationEmail(normalizedEmail, verificationCode);

        return buildEmailVerificationResponse({
          message: 'Verification code sent.',
          expiresAt: user.userEmailVerificationExpires,
        });
      } catch (error) {
        if (error.extensions?.code) throw error;
        console.error('User email verification request error:', error);
        throw new GraphQLError('Failed to send verification code', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

verifyUserEmail: async (_, { email, code }) => {
      try {
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select('+userEmailVerificationCode +userEmailVerificationExpires');

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        const savedCode = user.userEmailVerificationCode;
        const expiresAt = user.userEmailVerificationExpires;

        if (!savedCode || savedCode !== String(code || '').trim() || !expiresAt || expiresAt < new Date()) {
          throw new GraphQLError('Invalid or expired verification code', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        user.isUserEmailVerified = true;
        user.userEmailVerificationCode = undefined;
        user.userEmailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        const token = signUserToken(user, USER_TYPES.USER);

        return {
          userToken: token,
          user: buildUserAuthPayload(user)
        };
      } catch (error) {
        if (error.extensions?.code) throw error;
        console.error('User email verification error:', error);
        throw new GraphQLError('Failed to verify user email', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

createBusinessUser: async (_, { input }) => {
      try {
        const { username, email, password, role = 'regular' } = input;

        if (!username?.trim() || !email?.trim() || !password) {
          throw new GraphQLError('All fields are required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new GraphQLError('Invalid email format', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        if (!isValidUserPassword(password)) {
          throw new GraphQLError(USER_PASSWORD_RULE_MESSAGE, {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const normalizedRole = role.toLowerCase();
        const normalizedEmail = email.toLowerCase().trim();
        const verificationCode = generateUserEmailVerificationCode();

        const existingUser = await User.findOne({
          email: normalizedEmail,
          role: { $ne: 'ARTIST' }
        }).lean();

        if (existingUser) {
          throw new GraphQLError('Email already in use by a regular/premium user', {
            extensions: { code: 'CONFLICT' }
          });
        }

        const newUser = await User.create({
          username: username.trim(),
          email: normalizedEmail,
          password,
          role: normalizedRole,
          usageType: 'business',
          isUserEmailVerified: false,
          userEmailVerificationCode: verificationCode,
          userEmailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
          subscription: {
            status: 'none',
            periodEnd: normalizedRole === 'premium'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : null,
            planId: null
          },
          adLimits: {
            skipsAllowed: 5,
            lastReset: new Date()
          }
        });

        const token = signUserToken(newUser, USER_TYPES.USER);

        sendBusinessVerificationEmail(normalizedEmail, verificationCode);

        return {
          userToken: token,
          user: buildUserAuthPayload(newUser)
        };
      } catch (error) {
        console.error('Business user creation error:', error);

        if (error.code === 11000) {
          throw new GraphQLError('User already exists', {
            extensions: { code: 'CONFLICT' }
          });
        }

        if (error.extensions?.code) {
          throw error;
        }

        throw new GraphQLError('Failed to create business user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    requestBusinessUserEmailVerification: async (_, { email }) => {
      try {
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        const usageTypes = Array.isArray(user.usageType) ? user.usageType : [user.usageType].filter(Boolean);
        if (!usageTypes.includes('business')) {
          throw new GraphQLError('This account is not enabled for business access.', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        if (user.isUserEmailVerified) {
          return {
            success: true,
            message: 'Business email is already verified.'
          };
        }

        const verificationCode = generateUserEmailVerificationCode();
        user.userEmailVerificationCode = verificationCode;
        user.userEmailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        sendBusinessVerificationEmail(normalizedEmail, verificationCode);

        return {
          success: true,
          message: 'Verification code sent.'
        };
      } catch (error) {
        if (error.extensions?.code) throw error;
        console.error('Business email verification request error:', error);
        throw new GraphQLError('Failed to send verification code', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    verifyBusinessUserEmail: async (_, { email, code }) => {
      try {
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select('+userEmailVerificationCode +userEmailVerificationExpires');

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        const savedCode = user.userEmailVerificationCode;
        const expiresAt = user.userEmailVerificationExpires;

        if (!savedCode || savedCode !== String(code || '').trim() || !expiresAt || expiresAt < new Date()) {
          throw new GraphQLError('Invalid or expired verification code', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        user.isUserEmailVerified = true;
        user.userEmailVerificationCode = undefined;
        user.userEmailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        const token = signUserToken(user, USER_TYPES.USER);

        return {
          userToken: token,
          user: buildUserAuthPayload(user)
        };
      } catch (error) {
        if (error.extensions?.code) throw error;
        console.error('Business user email verification error:', error);
        throw new GraphQLError('Failed to verify business email', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },



   // LOGIN
    login: async (_, { email, password }) => {
      try {
        if (!email?.trim() || !password) {
          throw new GraphQLError('Email and password are required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const normalizedEmail = normalizeEmail(email);
        let user = await User.findOne({ email: normalizedEmail }).select('+password');
        const isMatch = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !isMatch) {
          const artist = await Artist.findOne({ email: normalizedEmail });
          const artistPasswordMatches = artist ? await artist.isCorrectPassword(password) : false;

          if (!artist || !artistPasswordMatches) {
            throw new GraphQLError('Invalid credentials', {
              extensions: { code: 'UNAUTHENTICATED' }
            });
          }

          user = await ensureUserForLegacyArtistLogin({ artist, password });
          if (!user) {
            throw new GraphQLError('Invalid credentials', {
              extensions: { code: 'UNAUTHENTICATED' }
            });
          }
        }

        const token = signUserToken(user, USER_TYPES.USER);

        return {
          userToken: token,
          user: buildUserAuthPayload(user)
        };

      } catch (error) {
        console.error('Login error:', error);

        if (error.extensions?.code) {
          throw error;
        }

        throw new GraphQLError('Login failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    updateBusinessUserProfile: async (_, { input }) => {
      try {
        const email = normalizeEmail(input.email);
        const { businessName, businessType, country, phoneNumber, address } = input;
        const normalizedCountry = String(country || '').trim();
        const eligibleCountries = ['USA', 'Rwanda'];

        if (!email || !businessName?.trim() || !businessType?.trim() || !normalizedCountry || !phoneNumber?.trim() || !address?.trim()) {
          throw new GraphQLError('All business fields are required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        if (!eligibleCountries.includes(normalizedCountry)) {
          throw new GraphQLError('Business licensing is currently available only in USA and Rwanda.', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const user = await User.findOne({ email }).select('+businessProfile.phoneVerificationCode +businessProfile.phoneVerificationExpires');

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        user.businessProfile = {
          ...(user.businessProfile?.toObject?.() || user.businessProfile || {}),
          businessName: businessName.trim(),
          businessType: businessType.trim(),
          country: normalizedCountry,
          phoneNumber: phoneNumber.trim(),
          address: address.trim()
        };

        user.usageType = 'business';
        user.isUserBusinessPhoneVerified = false;
        user.isBusinessProfileComplete = true;

        await user.save({ validateBeforeSave: false });

        return {
          success: true,
          message: 'Business profile updated.',
          email,
          verificationCode: null,
          user: buildUserAuthPayload(user)
        };
      } catch (error) {
        if (error.extensions?.code) throw error;
        console.error('Business profile update error:', error);
        throw new GraphQLError('Failed to update business profile', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    startBusinessOnboarding: async (_, { input }) => {
      try {
        const email = normalizeEmail(input.email);
        const { businessName, businessType, country, phoneNumber, address } = input;
        const normalizedCountry = String(country || '').trim();
        const eligibleCountries = ['USA', 'Rwanda'];

        if (!email || !businessName?.trim() || !businessType?.trim() || !normalizedCountry || !phoneNumber?.trim() || !address?.trim()) {
          throw new GraphQLError('All business fields are required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        if (!eligibleCountries.includes(normalizedCountry)) {
          throw new GraphQLError('Business licensing is currently available only in USA and Rwanda.', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const user = await User.findOne({ email }).select('+businessProfile.phoneVerificationCode +businessProfile.phoneVerificationExpires');

        if (!user) {
          throw new GraphQLError('Please create or log in to a personal account before starting business licensing.', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        if (user.usageType === 'business' && user.businessProfile?.phoneVerified) {
          return {
            success: true,
            message: 'Business account already exists for this email.',
            email,
            verificationCode: null,
            user: buildUserAuthPayload(user)
          };
        }

        const verificationCode = generatePhoneVerificationCode();
        user.businessProfile = {
          ...(user.businessProfile?.toObject?.() || user.businessProfile || {}),
          businessName: businessName.trim(),
          businessType: businessType.trim(),
          country: normalizedCountry,
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          phoneVerified: false,
          phoneVerificationCode: verificationCode,
          phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
        };

        await user.save({ validateBeforeSave: false });

        return {
          success: true,
          message: 'Phone verification code generated.',
          email,
          verificationCode,
          user: buildUserAuthPayload(user)
        };
      } catch (error) {
        if (error.extensions?.code) throw error;
        console.error('Business onboarding start error:', error);
        throw new GraphQLError('Failed to start business onboarding', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    verifyBusinessPhone: async (_, { email, code }) => {
      try {
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select('+businessProfile.phoneVerificationCode +businessProfile.phoneVerificationExpires');

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        const savedCode = user.businessProfile?.phoneVerificationCode;
        const expiresAt = user.businessProfile?.phoneVerificationExpires;

        if (!savedCode || savedCode !== String(code || '').trim() || !expiresAt || expiresAt < new Date()) {
          throw new GraphQLError('Invalid or expired verification code', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        user.businessProfile.phoneVerified = true;
        user.businessProfile.phoneVerificationCode = undefined;
        user.businessProfile.phoneVerificationExpires = undefined;
        user.isUserBusinessPhoneVerified = true;
        await user.save({ validateBeforeSave: false });

        return {
          success: true,
          message: 'Phone number verified.',
          email: normalizedEmail,
          verificationCode: null,
          user: buildUserAuthPayload(user)
        };
      } catch (error) {
        if (error.extensions?.code) throw error;
        console.error('Business phone verification error:', error);
        throw new GraphQLError('Failed to verify phone number', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    completeBusinessOnboarding: async (_, { email, password }) => {
      try {
        const normalizedEmail = normalizeEmail(email);

        if (!isValidUserPassword(password)) {
          throw new GraphQLError(USER_PASSWORD_RULE_MESSAGE, {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        if (!user.businessProfile?.phoneVerified) {
          throw new GraphQLError('Verify the business phone number before creating a password.', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        user.password = password;
        user.usageType = 'business';
        await user.save();

        const token = signUserToken(user, USER_TYPES.USER);

        return {
          userToken: token,
          user: buildUserAuthPayload(user)
        };
      } catch (error) {
        if (error.extensions?.code) throw error;
        console.error('Business onboarding completion error:', error);
        throw new GraphQLError('Failed to complete business onboarding', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    requestPasswordReset: async (_, { email }) => {
      try {
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail) {
          throw new GraphQLError('Email is required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          return {
            success: true,
            message: 'If an account exists, a reset link has been sent.'
          };
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/password-reset?token=${resetToken}`;

        await sendEmail(
          user.email,
          'Reset Your Password',
          `
            <p>We received a request to reset your password.</p>
            <p>This link is valid for 60 minutes.</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>If you did not request this, you can ignore this email.</p>
          `
        );

        return {
          success: true,
          message: 'Reset link sent. Check your email.'
        };
      } catch (error) {
        console.error('Password reset request error:', error);
        throw new GraphQLError('Failed to send reset link', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    resetPassword: async (_, { token, newPassword }) => {
      try {
        if (!token?.trim()) {
          throw new GraphQLError('Reset token is required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        if (!isValidUserPassword(newPassword)) {
          throw new GraphQLError(USER_PASSWORD_RULE_MESSAGE, {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const hashedToken = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');

        const user = await User.findOne({
          resetPasswordToken: hashedToken,
          resetPasswordExpires: { $gt: new Date() }
        }).select('+password');

        if (!user) {
          return {
            success: false,
            message: 'Reset link expired or invalid. Please request a new one.'
          };
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return {
          success: true,
          message: 'Password updated. You can log in now.'
        };
      } catch (error) {
        console.error('Password reset error:', error);
        if (error.extensions?.code) {
          throw error;
        }
        throw new GraphQLError('Failed to reset password', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
  



  





    // Update user (username or password)
    updateUser: async (parent, { userId, username, password }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId }, // Find user by ID
          { ...(username && { username }), ...(password && { password }) }, // Update only the fields provided
          { new: true } // Return the updated user
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }

        return updatedUser;
      } catch (error) {
        console.error("Failed to update username or password:", error);
        throw new Error("Failed to update user.");
      }
    },



  // upgradeUserToPremium
  // ---------------------
  // upgradeCurrentUserToPremium: async (_, __, { user }) => {
  //     ...
  //   },

  cancelCurrentUserSubscription: async (_, __, { user }) => {
      if (!user?._id) {
        throw new AuthenticationError('You must be logged in to cancel your subscription.');
      }

      const currentUser = await User.findById(user._id);
      if (!currentUser) {
        throw new AuthenticationError('User not found.');
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          role: 'regular',
          'subscription.status': 'canceled',
          'subscription.periodEnd': currentUser.subscription?.periodEnd || new Date(),
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new GraphQLError('Unable to cancel subscription at the moment.');
      }

      return updatedUser;
    },





    // Delete user
    deleteUser: async (parent, { userId }) => {
      try {
        const deletedUser = await User.findOneAndDelete({ _id: userId });
        if (!deletedUser) {
          throw new Error("User not found");
        }
        return "User deleted successfully";
      } catch (error) {
        console.error("Failed to delete user:", error);
        throw new Error("Failed to delete user.");
      }
    },







addDownload: async (parent, { songId }, { user, Download }) => {
  if (!user) {
    throw new AuthenticationError('You must be logged in!');
  }

  try {
    // Check if the download record already exists
    const existingDownload = await Download.findOne({ user: user.id, downloaded_songs: songId });

    if (existingDownload) {
      throw new Error('This song has already been downloaded by the user.');
    }

    // Create a new download record
    const download = new Download({
      user: user.id,
      downloaded_songs: songId,
    });

    await download.save();

    return download;
  } catch (error) {
    console.error('Failed to add download:', error);
    throw new Error('Failed to add download.');
  }
},


addLikedSong: async (parent, { userId, songId }, { LikedSongs }) => {
  try {
    // Check if the song is already liked by the user
    const existingLikedSong = await LikedSongs.findOne({ user: userId, liked_songs: songId });

    if (existingLikedSong) {
      throw new Error('This song is already liked by the user.');
    }

    // Add the liked song
    const likedSong = new LikedSongs({
      user: userId,
      liked_songs: songId,
    });

    await likedSong.save();

    return likedSong;
  } catch (error) {
    console.error('Failed to like the song:', error);
    throw new Error('Failed to like the song.');
  }
},



  createPlaylist : async (parent, { title, description, songs }, { user }) => {
  try {
    const MAX_PLAYLIST_SONGS = 50;
   
    if (!user?._id) {
      throw new Error('Authentication required. Please log in to create a playlist.');
    }

    if (Array.isArray(songs) && songs.length > MAX_PLAYLIST_SONGS) {
      throw new Error('Playlist maximum reached. Remove some in your collection.');
    }

    // Create the playlist
    const playlist = new Playlist({
      title,
      description,
      songs: Array.isArray(songs) ? songs : [],
      createdBy: user._id  // Use the authenticated user's ID
    });

    // Save the playlist to the database
    await playlist.save();

    return playlist;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw new Error(error.message || 'Failed to create playlist.');
  }
},

  addSongToPlaylist: async (_parent, { playlistId, songId }, { user }) => {
    if (!user?._id) {
      throw new AuthenticationError('You must be logged in!');
    }

    const MAX_PLAYLIST_SONGS = 50;
    const existing = await Playlist.findOne({ _id: playlistId, createdBy: user._id }).select('songs');

    if (!existing) {
      throw new Error('Playlist not found.');
    }

    if (Array.isArray(existing.songs) && existing.songs.length >= MAX_PLAYLIST_SONGS) {
      throw new Error('Playlist maximum reached. Remove some in your collection.');
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, createdBy: user._id },
      { $addToSet: { songs: songId } },
      { new: true }
    ).populate({
      path: 'songs',
      populate: [
        { path: 'artist', select: 'artistAka country bio followers artistDownloadCounts profileImage' },
        { path: 'album', select: 'title releaseDate albumCoverImage' },
      ],
    });

    if (!playlist) {
      throw new Error('Playlist not found.');
    }

    return playlist;
  },

  removeSongFromPlaylist: async (_parent, { playlistId, songId }, { user }) => {
    if (!user?._id) {
      throw new AuthenticationError('You must be logged in!');
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, createdBy: user._id },
      { $pull: { songs: songId } },
      { new: true }
    ).populate({
      path: 'songs',
      populate: [
        { path: 'artist', select: 'artistAka country bio followers artistDownloadCounts profileImage' },
        { path: 'album', select: 'title releaseDate albumCoverImage' },
      ],
    });

    if (!playlist) {
      throw new Error('Playlist not found.');
    }

    return playlist;
  },

  reorderPlaylistSongs: async (_parent, { playlistId, songIds }, { user }) => {
    if (!user?._id) {
      throw new AuthenticationError('You must be logged in!');
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, createdBy: user._id },
      { $set: { songs: songIds } },
      { new: true }
    ).populate({
      path: 'songs',
      populate: [
        { path: 'artist', select: 'artistAka country bio followers artistDownloadCounts profileImage' },
        { path: 'album', select: 'title releaseDate albumCoverImage' },
      ],
    });

    if (!playlist) {
      throw new Error('Playlist not found.');
    }

    return playlist;
  },

  deletePlaylist: async (_parent, { playlistId }, { user }) => {
    if (!user?._id) {
      throw new AuthenticationError('You must be logged in!');
    }

    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, createdBy: user._id });

    if (!playlist) {
      throw new Error('Playlist not found.');
    }

    return true;
  },

  markNotificationRead: async (_parent, { notificationId }, { user }) => {
    if (!user?._id) {
      throw new AuthenticationError('You must be logged in!');
    }
    const notification = await UserNotification.findOneAndUpdate(
      { _id: notificationId, userId: user._id },
      { isNotificationSeen: true },
      { new: true }
    );
    if (!notification) {
      throw new Error('Notification not found.');
    }
    return notification;
  },
  
  markMessagesReadByUser: async (_parent, { bookingId }, { user }) => {
    if (!user?._id) {
      throw new AuthenticationError('You must be logged in!');
    }
    const booking = await BookArtist.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }
    if (booking.user?.toString() !== user._id.toString()) {
      throw new AuthenticationError('You are not part of this booking.');
    }
    await Message.updateMany({ bookingId, readByUser: false }, { readByUser: true });
    return true;
  },


// other resolvers

detectUserLocation,
toggleLikeSong,

  },
  // Note: Song field resolvers are owned by Artist schema

  };


export default resolvers;
