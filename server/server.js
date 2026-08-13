// ✅ Setup early
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

// testing redis
import { getUserProfile, getSession, K} from "./utils/AdEngine/redis/redisSchema.js";
import { getRedis, initializeRedis, populateTestData, debugRedisKeys } from "./utils/AdEngine/redis/redisClient.js";
import { checkRedisHealth } from "./utils/AdEngine/redis/redisClient.js";


import { fileURLToPath } from 'url';
import fs from "fs/promises";

// Import necessary packages and functions
import connectDB from "./config/connection.js";
import { expressMiddleware } from "@apollo/server/express4";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

import { ApolloServer } from "@apollo/server";
import Stripe from 'stripe';
import { createServer } from "http";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import cleanupAbandonedDrafts from "./utils/serverCleanUpAd.js";

import path from "path";

import {
  artist_typeDefs,
  artist_resolvers,
} from "./schemas/Artist_schema/index.js";
import { user_typeDefs, user_resolvers } from "./schemas/User_schema/index.js";
import { advertizer_typeDefs, advertizer_resolver} from "./schemas/Advertizer_schema/index.js"

import { getArtistFromToken } from "./utils/artist_auth.js";
import { getUserFromToken } from "./utils/user_auth.js";
import { getAdvertizerFromToken } from "./utils/advertizer_auth.js";
// import { combinedAuthMiddleware } from "./utils/combinedAuth.js";
import {combinedAuthMiddleware} from './utils/AuthSystem/authMiddleware.js'

import merge from "lodash.merge";
import cors from "cors";
import jwt from "jsonwebtoken";
import Artist from "./models/Artist/Artist.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import location from './routes/location.js';
import verifyAdvertizerEmail from './routes/verifyAdvertizerEmail.js'
import supportRoute from './routes/support.js';
import { RadioStation, Song } from "./models/Artist/index_artist.js";
import { RADIO_TYPES } from "./utils/radioTypes.js";
import { getPresignedUrlDownload } from "./utils/cloudFrontUrl.js";

import monitorSubscriptions from "./utils/subscriptionMonitor.js";
import {
  handleInvoicePaymentSucceeded,
  handleSessionExpired,
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleArtistSupportPaymentSucceeded,
  handleArtistSupportPaymentFailed,
} from "./routes/webhook.js";
import geoip from 'geoip-lite';
import aiMixRoutes from "./routes/aiMix.js";
import { signArtistToken } from "./utils/artist_auth.js";
import { USER_TYPES } from "./utils/AuthSystem/constant/systemRoles.js";


import { resolve } from "dns";

// Initialize dotenv for environment variables
dotenv.config();

const app = express();
// Set up port and express app
const PORT = process.env.PORT || 3001;
app.set("trust proxy", 1); // ✅ FIXED

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, "").trim();

const isMongoObjectId = (value) =>
  typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

const getPublicAppUrl = () =>
  (process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://flolup.com").replace(/\/+$/, "");

const toAbsoluteUrl = (value, baseUrl) => {
  if (!value || typeof value !== "string") return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${baseUrl}${value}`;
  return `${baseUrl}/${value.replace(/^\/+/, "")}`;
};

const getKeyFromUrlOrKey = (value) => {
  if (!value || typeof value !== "string") return "";
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");
  try {
    const url = new URL(value);
    return decodeURIComponent((url.pathname || "").replace(/^\/+/, ""));
  } catch {
    return "";
  }
};

const resolveShareArtworkUrl = async (artwork, baseUrl) => {
  const fallback = `${baseUrl}/logo-512.png`;
  if (!artwork) return fallback;

  const key = getKeyFromUrlOrKey(artwork);
  if (key) {
    try {
      const signed = await getPresignedUrlDownload(null, {
        bucket: "afrofeel-cover-images-for-songs",
        key,
        region: "us-east-2",
      });
      if (signed?.url) return signed.url;
    } catch (error) {
      console.warn("Share artwork signing failed:", error?.message || error);
    }
  }

  return toAbsoluteUrl(artwork, baseUrl) || fallback;
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceMetaTag = (html, attr, key, tag) => {
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attr}=["']${escapeRegExp(key)}["'][^>]*>`,
    "i"
  );
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
};

const injectTrackMeta = (html, { title, description, url, image, type = "music.song" }) => {
  let nextHtml = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  const tags = [
    [`name`, `description`, description],
    [`property`, `og:title`, title],
    [`property`, `og:description`, description],
    [`property`, `og:type`, type],
    [`property`, `og:url`, url],
    [`property`, `og:image`, image],
    [`name`, `twitter:card`, "summary_large_image"],
    [`name`, `twitter:title`, title],
    [`name`, `twitter:description`, description],
    [`name`, `twitter:image`, image],
  ];

  for (const [attr, key, value] of tags) {
    nextHtml = replaceMetaTag(
      nextHtml,
      attr,
      key,
      `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`
    );
  }

  return nextHtml;
};

const readClientIndexHtml = async ({ indexPath, hasClientBuild, baseUrl }) => {
  if (hasClientBuild) {
    return fs.readFile(indexPath, "utf8");
  }

  const response = await fetch(`${baseUrl}/index.html`);
  if (!response.ok) {
    throw new Error(`Unable to fetch frontend index.html: ${response.status}`);
  }
  return response.text();
};

const buildSongShareMeta = async ({ songId, pagePath, baseUrl }) => {
  if (!isMongoObjectId(songId)) return null;

  let song = null;
  try {
    song = await Song.findById(songId)
      .select("title artwork lyrics genre duration releaseDate visibility")
      .populate("artist", "artistAka")
      .populate("album", "title releaseDate albumCoverImage")
      .lean();
  } catch (error) {
    if (error?.name === "CastError") return null;
    throw error;
  }

  if (!song || song.visibility === "private") return null;

  const artistName = song.artist?.artistAka || "FloLup artist";
  const title = `${song.title} by ${artistName}`;
  const albumName = song.album?.title && song.album.title !== "Single"
    ? ` from ${song.album.title}`
    : "";
  const description =
    stripHtml(song.lyrics)?.slice(0, 150) ||
    `Listen to ${song.title} by ${artistName}${albumName}${song.genre ? ` #${song.genre}` : ""} on FloLup.`;
  const image = await resolveShareArtworkUrl(song.artwork || song.album?.albumCoverImage, baseUrl);

  return {
    title,
    description,
    image,
    url: `${baseUrl}${pagePath}`,
  };
};

const renderSongSharePage = async ({ req, res, next, indexPath, hasClientBuild, songId, pagePath }) => {
  try {
    const baseUrl = getPublicAppUrl();
    const html = await readClientIndexHtml({ indexPath, hasClientBuild, baseUrl });
    const meta = isMongoObjectId(songId)
      ? await buildSongShareMeta({ songId, pagePath, baseUrl })
      : null;

    res.set("Content-Type", "text/html");
    if (!meta) return res.send(html);

    res.set("Cache-Control", "public, max-age=300, s-maxage=900");
    return res.send(injectTrackMeta(html, meta));
  } catch (error) {
    console.error(`Song metadata render failed for ${req.path}:`, error);
    return next();
  }
};

const buildArtistShareMeta = async ({ artistId, pagePath, baseUrl }) => {
  const artist = await Artist.findById(artistId)
    .select("artistAka fullName bio country region genre profileImage coverImage")
    .lean();

  if (!artist) return null;

  const artistName = artist.artistAka || artist.fullName || "FloLup artist";
  const genreList = Array.isArray(artist.genre) ? artist.genre.filter(Boolean).join(", ") : artist.genre;
  const location = artist.country || artist.region || "";
  const description =
    stripHtml(artist.bio)?.slice(0, 150) ||
    `Discover ${artistName}${genreList ? `, ${genreList}` : ""}${location ? ` from ${location}` : ""} on FloLup.`;
  const image = await resolveShareArtworkUrl(artist.coverImage || artist.profileImage, baseUrl);

  return {
    title: `${artistName} on FloLup`,
    description,
    image,
    type: "profile",
    url: `${baseUrl}${pagePath}`,
  };
};

const renderArtistSharePage = async ({ req, res, next, indexPath, hasClientBuild, artistId, pagePath }) => {
  try {
    const baseUrl = getPublicAppUrl();
    const html = await readClientIndexHtml({ indexPath, hasClientBuild, baseUrl });
    const meta = await buildArtistShareMeta({ artistId, pagePath, baseUrl });

    res.set("Content-Type", "text/html");
    if (!meta) return res.send(html);

    res.set("Cache-Control", "public, max-age=300, s-maxage=900");
    return res.send(injectTrackMeta(html, meta));
  } catch (error) {
    console.error(`Artist metadata render failed for ${req.path}:`, error);
    return next();
  }
};

// Register webhook endpoint
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const DASHBOARD_WHSEC = process.env.STRIPE_WEBHOOK_ADS_PAYMENT 

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, DASHBOARD_WHSEC);
// Added event logging
  } catch (err) {
    console.error('❌ Webhook Error:', {
      message: err.message,
      event: req.body?.type || 'unknown'
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ========== Event Processing ==========
  try {
    switch (event.type) {
      // ----- Subscription Events -----
      case 'invoice.payment_succeeded':
      case 'invoice_payment.paid': {
        const invoice = event.data.object;
        handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        handleSubscriptionDeleted(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        handleSubscriptionUpdated(subscription);
        break;
      }

      // ----- Checkout Events -----
      case 'checkout.session.expired': {
        const session = event.data.object;
        handleSessionExpired(session);
        break;
      }

      // ----- Payment Intents (Ads) -----
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata?.type === 'artist_support') {
          handleArtistSupportPaymentSucceeded(paymentIntent);
        } else {
          handlePaymentIntentSucceeded(paymentIntent);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata?.type === 'artist_support') {
          handleArtistSupportPaymentFailed(paymentIntent);
        } else {
          handlePaymentIntentFailed(paymentIntent);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        if (typeof handlePaymentIntentCanceled === 'function') {
          handlePaymentIntentCanceled(paymentIntent);
        }
        break;
      }

      default: {
        console.warn(`⚠️ Unhandled event: ${event.type} (${event.id})`);
        break;
      }
    }

    return res.status(200).json({ 
      received: true,
      event: event.type  // Echo back for debugging
    });

  } catch (handlerErr) {
    console.error('⚠️ Handler Error:', {
      event: event.type,
      error: handlerErr.message,
      stack: handlerErr.stack
    });
    return res.status(500).json({ error: 'Handler processing failed' });
  }
});


// adPayment webhook 
// ==================

// app.post('/api/stripe/webhook-ads', express.raw({ type: 'application/json' }), (req, res) => {
  
  
//   const signature = req.headers['stripe-signature'];
//   let event;

//   if (endPointSecretForAdPayment) {
//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,  // The raw request body
//         signature,
//         endPointSecretForAdPayment
//       );
//     } catch (error) {  // You had 'err' here but declared 'error' above
//       return res.sendStatus(400);
//     }

//     // Handle the event
//     switch (event.type) {
//       case 'payment_intent.succeeded':
//         const paymentIntent = event.data.object;
//         // update the database, send the message to the advertiser
//         handlePaymentIntentSucceeded(paymentIntent);
//         break;
        
//       case 'payment_intent.payment_failed':
//         const paymentIntentFailed = event.data.object;
//         // send the message to tell him/her the payment failed or is abandoned
//         handlePaymentIntentFailed(paymentIntentFailed);
//         break;
        
//       // It's good practice to handle unexpected event types
//       default:
//     }
//   } else {
//     return res.sendStatus(400);
//   }

//   // Return a response to acknowledge receipt of the event
//   res.json({ received: true });
// });










const httpServer = createServer(app);




// // List of allowed origins
// const allowedOrigins = [
//   'http://localhost:3000',
//   'http://localhost:3001',
//   'http://localhost:3003',
//   'http://localhost:5173',

//   // ✅ add these
//   'http://127.0.0.1:3000',
//   'http://127.0.0.1:3001',
//   'http://127.0.0.1:3003',
//   'http://127.0.0.1:5173',

//   'https://flolup.com',
//   'https://www.flolup.com',
// ];


// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true,
//   methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type','Authorization','apollo-require-preflight'],
// }));

// // (optional) make OPTIONS succeed fast
// app.options('*', cors({
//   origin: allowedOrigins,
//   credentials: true,
//   methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type','Authorization','apollo-require-preflight'],
// }));


// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3003',
  'http://localhost:5173',

  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:5173',

  'https://flolup.com',
  'https://www.flolup.com',
   'https://api.flolup.com',
   
];

// Shared CORS config
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl/postman
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'apollo-require-preflight',
    'x-apollo-operation-name',
    'x-user-authorization',
    'x-artist-authorization',
  ],
};

// Apply globally
app.use(cors(corsOptions));

// Make OPTIONS succeed fast
app.options('*', cors(corsOptions));



// Body parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    return next();
  }
  return express.json({ limit: '2mb' })(req, res, next);
});


// File upload middleware
app.use(graphqlUploadExpress({ maxFileSize: 1000000000, maxFiles: 10 }));

// Combining typeDefs and resolvers
const typeDefs = [artist_typeDefs, user_typeDefs, advertizer_typeDefs];
const resolvers = merge(artist_resolvers, user_resolvers, advertizer_resolver);

// Create GraphQL schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});


const serverCleanup = useServer(
  {
    schema,
    context: async (ctx) => {
      try {
        const authHeader = ctx.connectionParams?.authorization || "";
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;


        if (!token) {
          throw new Error("No token provided");
        }

        // Create a mock request object to use with combinedAuthMiddleware
        const mockReq = { 
          headers: { 
            authorization: `Bearer ${token}` 
          } 
        };
        
        // Use the SAME authentication logic as HTTP requests
        const reqWithAuth = await combinedAuthMiddleware({ req: mockReq });

        // Return the authenticated context
        if (reqWithAuth.artist) {
          return { artist: reqWithAuth.artist };
        }
        if (reqWithAuth.user) {
          return { user: reqWithAuth.user };
        }
        if (reqWithAuth.advertizer) {
          return { advertizer: reqWithAuth.advertizer };
        }

        throw new Error("Authentication failed");
      } catch (error) {
        console.error("WS Authentication Error:", error.message);
        throw new Error("CONNECTION_INIT_ERROR: Authentication failed");
      }
    },
    onConnect: (ctx) => {
    },
    onDisconnect: (ctx, code, reason) => {
    },
  },
  wsServer
);



// Set up Apollo Server with GraphQL schema
const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
            await wsServer.close();
          },
        };
      },
    },
  ],
  csrfPrevention: process.env.NODE_ENV === "production",
});

// Routes
app.use("/api", stripeRoutes);

// =============================

app.set('trust proxy', 1);

app.use("/api/location", location);
app.use("/api/ai", aiMixRoutes);







// ======================================

// testing redis
// Initialize Redis on server start

app.use(async (req, res, next) => {
  try {
    await initializeRedis();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Redis connection failed' });
  }
});

// Your location endpoint - FIXED
app.get('/api/location/redis', async (req, res) => {
  const { userId, sessionId } = req.query;
  
  
  try {
    const r = await getRedis();
    
    // Get user and session data
    const [userData, sessionData] = await Promise.all([
      getUserProfile(userId),
      getSession(sessionId)
    ]);
    
    const response = {
      userId,
      sessionId,
      user: userData || { 
        role: null, 
        lastGeo: null, 
        profileUpdatedAt: null 
      },
      session: sessionData || {
        songsPlayed: 0,
        songsFinished: 0,
        songsSkipped: 0,
        ms_listened: 0,
        timeSecs: 0,
        lastEventTs: null,
        device: null,
        role: null,
        country: null,
        city: null
      },
      userAgg: null,
      eventsCount: 0,
      latestEvents: []
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Redis location error:', error);
    res.status(500).json({ 
      error: error.message,
      userId,
      sessionId 
    });
  }
});

// Debug endpoints
app.get('/api/debug/redis-keys', async (req, res) => {
  const { pattern = 'user:*' } = req.query;
  try {
    const keys = await debugRedisKeys(pattern);
    res.json({ keys, pattern });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/populate-test', async (req, res) => {
  try {
    await populateTestData();
    res.json({ success: true, message: 'Test data populated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/health', async (req, res) => {
  try {
    const healthy = await checkRedisHealth();
    res.json({ redis: healthy ? 'healthy' : 'unhealthy' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});









// ==========================










// ------------------------


// utils/locationDetectorServerSide.js


// -----------------------------------------



app.use('/api', verifyAdvertizerEmail);
app.use('/api/support', supportRoute);

// Start the Apollo Server and connect to the DB
const startApolloServer = async () => {
  try {

 // Connect to database
    await connectDB();

    const ensureRadioStations = async () => {
      const existing = await RadioStation.countDocuments();
      if (existing > 0) return;

      const artists = await Artist.find().select("_id artistAka").limit(1).lean();
      const stations = [
        {
          name: "Afrobeats Heat",
          description: "Afrobeats and Afro-Fusion movers.",
          type: RADIO_TYPES.GENRE_RADIO,
          seeds: [{ seedType: "genre", seedId: "Afrobeats" }],
        },
        {
          name: "Amapiano Groove",
          description: "Deep log drums and dancefloor energy.",
          type: RADIO_TYPES.GENRE_RADIO,
          seeds: [{ seedType: "genre", seedId: "Amapiano" }],
        },
        {
          name: "Gospel & Worship",
          description: "Spirit-lifting vocals and praise anthems.",
          type: RADIO_TYPES.MOOD_RADIO,
          seeds: [{ seedType: "mood", seedId: "Spiritual" }],
        },
        {
          name: "Late Night R&B",
          description: "Slow burns for after-hours listening.",
          type: RADIO_TYPES.MOOD_RADIO,
          seeds: [{ seedType: "mood", seedId: "Late Night" }],
        },
        {
          name: "Street Anthems",
          description: "Hustle energy and gritty beats.",
          type: RADIO_TYPES.MOOD_RADIO,
          seeds: [{ seedType: "mood", seedId: "Street" }],
        },
        {
          name: "Afro Pop Breeze",
          description: "Feel-good Afropop and crossover hooks.",
          type: RADIO_TYPES.GENRE_RADIO,
          seeds: [{ seedType: "genre", seedId: "Afro Pop" }],
        },
        {
          name: "2010s Classics",
          description: "Hits from the 2010s era.",
          type: RADIO_TYPES.ERA_RADIO,
          seeds: [{ seedType: "era", seedId: "2010s" }],
        },
        {
          name: "Discovery Mix",
          description: "Fresh picks outside your usual rotation.",
          type: RADIO_TYPES.DISCOVER_RADIO,
          seeds: [{ seedType: "genre", seedId: "Afro-Fusion" }],
        },
        {
          name: "Afro Mix",
          description: "A blend of Afrobeats, Amapiano, and Afro Pop.",
          type: RADIO_TYPES.MIX_RADIO,
          seeds: [
            { seedType: "genre", seedId: "Afrobeats" },
            { seedType: "genre", seedId: "Amapiano" },
            { seedType: "genre", seedId: "Afro Pop" },
          ],
        },
      ];

      if (artists.length > 0) {
        stations.push({
          name: `Artist Radio: ${artists[0].artistAka || "Featured"}`,
          description: "Based on a standout Afrofeel artist.",
          type: RADIO_TYPES.ARTIST_RADIO,
          seeds: [{ seedType: "artist", seedId: String(artists[0]._id) }],
          createdBy: artists[0]._id,
        });
      }

      await RadioStation.insertMany(
        stations.map((station) => ({ ...station, visibility: "public" }))
      );
    };

    await ensureRadioStations();

    // Start Apollo Server
    await server.start();

    

    // Use combined auth middleware
    // app.use(async (req, _res, next) => {
    //   await combinedAuthMiddleware({ req });
    //   next();
    // });

    app.use(async (req, _res, next) => {

  const authenticatedReq = await combinedAuthMiddleware({ req });
  
  // Copy the authenticated properties to the original request
  if (authenticatedReq.user) req.user = authenticatedReq.user;
  if (authenticatedReq.artist) req.artist = authenticatedReq.artist;
  if (authenticatedReq.advertiser) req.advertiser = authenticatedReq.advertiser;
  if (authenticatedReq.auth) req.auth = authenticatedReq.auth;

  next();
});

    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req }) => ({
          req,
          artist: req.artist || null,
          user: req.user || null,
          advertizer: req.advertiser || null,
        }),
      })
    );

//     app.use(
//   "/graphql",
//   expressMiddleware(server, {
//     context: async ({ req }) => {
      
//       return {
//         user: req.user || null,
//         artist: req.artist || null,
//         advertiser: req.advertiser || null,
//       };
//     },
//   })
// );



    // Start background monitoring
    monitorSubscriptions();



    // Email verification route
    // app.get("/confirmation/:artist_id_token", async (req, res) => {
    //   const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    //   try {
    //     const decoded = jwt.verify(
    //       req.params.artist_id_token,
    //       process.env.JWT_SECRET_ARTIST
    //     );
    //     if (!decoded || !decoded.data || !decoded.data._id) {
    //       throw new Error("Invalid token structure");
    //     }
    //     const { _id } = decoded.data;
    //     await Artist.findByIdAndUpdate(_id, { confirmed: true });
    //     return res.redirect(`${frontendUrl}/artist/login`);
    //   } catch (e) {
    //     if (e?.name === "TokenExpiredError") {
    //       return res.redirect(`${frontendUrl}/artist/verification?status=expired`);
    //     }
    //     return res.redirect(`${frontendUrl}/artist/verification?status=invalid`);
    //   }
    // });



app.get("/confirmation/:artist_id_token", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  
  
  try {
    const decoded = jwt.verify(
      req.params.artist_id_token,
      process.env.JWT_SECRET_ARTIST
    );
    
    const artistId = decoded._id || decoded.id || decoded.userId || decoded.data?._id || decoded.artistId;
    
    if (!artistId) {
      return res.redirect(`${frontendUrl}/artist/verification?status=invalid`);
    }
    
    // Update the artist
    await Artist.findByIdAndUpdate(
      artistId,
      { confirmed: true },
      { new: true }
    );
    
    
    // SIMPLE: Just redirect to login - no message needed
    return res.redirect(`${frontendUrl}/artist/login`);
    
  } catch (e) {
    
    if (e?.name === "TokenExpiredError") {
      return res.redirect(`${frontendUrl}/artist/verification?status=expired`);
    }
    return res.redirect(`${frontendUrl}/artist/verification?status=invalid`);
  }
});




app.get("/confirmation/:artist_id_token", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  
  
  try {
    const decoded = jwt.verify(
      req.params.artist_id_token,
      process.env.JWT_SECRET_ARTIST
    );
    
    const artistId = decoded._id || decoded.id || decoded.userId || decoded.data?._id || decoded.artistId;
    
    if (!artistId) {
      return res.redirect(`${frontendUrl}/artist/verification?status=invalid`);
    }
    
    // Update the artist
    const updatedArtist = await Artist.findByIdAndUpdate(
      artistId,
      { confirmed: true },
      { new: true }
    );
    
    
    // Generate a fresh token with updated data
    const authToken = jwt.sign(
      { 
        _id: updatedArtist._id, 
        email: updatedArtist.email,
        confirmed: updatedArtist.confirmed,
        role: 'artist' 
      },
      process.env.JWT_SECRET_ARTIST,
      { expiresIn: '7d' }
    );
    
    // Redirect to plan page with new token to refresh localStorage
    return res.redirect(`${frontendUrl}/artist/plan?token=${authToken}`);
    
  } catch (e) {
    
    if (e?.name === "TokenExpiredError") {
      return res.redirect(`${frontendUrl}/artist/verification?status=expired`);
    }
    return res.redirect(`${frontendUrl}/artist/verification?status=invalid`);
  }
});

    // Plan verification and confirmation status route
    app.post("/api/confirmationStatusAndPlanStatus", async (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      try {
        const artist = await Artist.findOne({ email });
        if (!artist) {
          return res.status(404).json({ error: "Artist not found" });
        }
        return res.json({
          confirmed: artist.confirmed,
          selectedPlan: artist.selectedPlan,
          plan: artist.plan,
          artistAka: artist.artistAka,
        });
      } catch (error) {
        console.error("Error checking confirmation:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });


    // Define the cleanup route
app.post('/api/cleanup', async (req, res) => {
  try {
    const deletedCount = await cleanupAbandonedDrafts();
    res.status(200).json({ message: `Deleted ${deletedCount} abandoned draft ads.` });
  } catch (error) {
    console.error('Error cleaning up:', error);
    res.status(500).json({ error: 'Failed to clean up abandoned drafts.' });
  }
});

    // Production setup
    if (process.env.NODE_ENV === "production") {
      const clientDistPath = path.join(__dirname, "../client/dist");
      const indexPath = path.join(clientDistPath, "index.html");
      let hasClientBuild = true;

      try {
        await fs.access(indexPath);
      } catch {
        hasClientBuild = false;
        console.error(`Client build missing: ${indexPath}. Run the client build before serving frontend routes.`);
      }

      app.get("/track/:trackId", async (req, res, next) => {
        return renderSongSharePage({
          req,
          res,
          next,
          indexPath,
          hasClientBuild,
          songId: req.params.trackId,
          pagePath: `/track/${req.params.trackId}`,
        });
      });

      app.get("/song/:songId", async (req, res, next) => {
        return renderSongSharePage({
          req,
          res,
          next,
          indexPath,
          hasClientBuild,
          songId: req.params.songId,
          pagePath: `/song/${req.params.songId}`,
        });
      });

      app.get("/album/:albumId/:songId", async (req, res, next) => {
        return renderSongSharePage({
          req,
          res,
          next,
          indexPath,
          hasClientBuild,
          songId: req.params.songId,
          pagePath: `/album/${req.params.albumId}/${req.params.songId}`,
        });
      });

      app.get("/artist/:artistId", async (req, res, next) => {
        return renderArtistSharePage({
          req,
          res,
          next,
          indexPath,
          hasClientBuild,
          artistId: req.params.artistId,
          pagePath: `/artist/${req.params.artistId}`,
        });
      });

      if (hasClientBuild) {
        app.use(express.static(clientDistPath));
        app.get("*", (req, res) => {
          res.sendFile(indexPath);
        });
      } else {
        app.get("*", (req, res) => {
          res.status(503).send("Client build is missing on the server.");
        });
      }
    }

   

    // Start the server
    httpServer.listen(PORT, () => {
    });
  } catch (error) {
    console.error("Error starting Apollo Server:", error);
  }
};

// Call the function to start the Apollo Server
startApolloServer();
