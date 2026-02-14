// ✅ Setup early
import express from "express";
import dotenv from "dotenv";
dotenv.config();

// testing redis
import { getUserProfile, getSession, K} from "./utils/AdEngine/redis/redisSchema.js";
import { getRedis, initializeRedis, populateTestData, debugRedisKeys } from "./utils/AdEngine/redis/redisClient.js";
import { checkRedisHealth } from "./utils/AdEngine/redis/redisClient.js";


import { fileURLToPath } from 'url';

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
import { RadioStation } from "./models/Artist/index_artist.js";
import { RADIO_TYPES } from "./utils/radioTypes.js";

import monitorSubscriptions from "./utils/subscriptionMonitor.js";
import { handleInvoicePaymentSucceeded, handleSessionExpired, handleInvoicePaymentFailed, handleSubscriptionDeleted, handleSubscriptionUpdated,  handlePaymentIntentSucceeded,   handlePaymentIntentFailed} from "./routes/webhook.js";
import geoip from 'geoip-lite';
import aiMixRoutes from "./routes/aiMix.js";



import { resolve } from "dns";

// Initialize dotenv for environment variables
dotenv.config();

const app = express();
// Set up port and express app
const PORT = process.env.PORT || 3001;
app.set("trust proxy", 1); // ✅ FIXED

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register webhook endpoint
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const DASHBOARD_WHSEC = process.env.STRIPE_WEBHOOK_ADS_PAYMENT 

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, DASHBOARD_WHSEC);
    console.log(`🔔 Received ${event.type} (${event.id})`); // Added event logging
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
        console.log('💰 Invoice paid:', invoice.id);
        handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('❌ Invoice failed:', invoice.id);
        handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('🗑️ Subscription deleted:', subscription.id);
        handleSubscriptionDeleted(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('🔄 Subscription updated:', subscription.id);
        handleSubscriptionUpdated(subscription);
        break;
      }

      // ----- Checkout Events -----
      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log('⏳ Checkout expired:', session.id);
        handleSessionExpired(session);
        break;
      }

      // ----- Payment Intents (Ads) -----
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('✅ Ad payment succeeded:', paymentIntent.id);
        handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('❌ Ad payment failed:', paymentIntent.id);
        handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        console.log('🚫 Ad payment canceled:', paymentIntent.id);
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
//   console.log('the ad webhook is firing ...');
  
  
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
//       console.log(`⚠️  Webhook signature verification failed.`, error.message);
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
//         console.log(`Unhandled event type ${event.type}`);
//     }
//   } else {
//     console.log('Warning: No endpoint secret configured for ad payments');
//     return res.sendStatus(400);
//   }

//   // Return a response to acknowledge receipt of the event
//   res.json({ received: true });
// });










const httpServer = createServer(app);




// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3003',
  'http://localhost:5173',
  'https://flolup.com',
  'https://www.flolup.com',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','apollo-require-preflight'],
}));

// (optional) make OPTIONS succeed fast
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','apollo-require-preflight'],
}));





// Body parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '2mb' }));

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

        console.log('WS Auth called with token:', token ? 'present' : 'missing');

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
          console.log('WS Artist authenticated:', reqWithAuth.artist._id);
          return { artist: reqWithAuth.artist };
        }
        if (reqWithAuth.user) {
          console.log('WS User authenticated:', reqWithAuth.user._id);
          return { user: reqWithAuth.user };
        }
        if (reqWithAuth.advertizer) {
          console.log('WS Advertizer authenticated:', reqWithAuth.advertizer._id);
          return { advertizer: reqWithAuth.advertizer };
        }

        throw new Error("Authentication failed");
      } catch (error) {
        console.error("WS Authentication Error:", error.message);
        throw new Error("CONNECTION_INIT_ERROR: Authentication failed");
      }
    },
    onConnect: (ctx) => {
      console.log("New subscription connection");
    },
    onDisconnect: (ctx, code, reason) => {
      console.log(`Disconnected: ${code} ${reason}`);
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
  
  console.log('Redis Location Request:', { userId, sessionId });
  
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
    console.log("Attempting to connect to the database...");
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
      console.log(`Seeded ${stations.length} default radio stations.`);
    };

    await ensureRadioStations();

    // Start Apollo Server
    console.log("Apollo Server starting...");
    await server.start();
    console.log("Apollo Server started successfully");

    

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
//       console.log('🔍 GraphQL Context DEBUG:');
//       console.log('  - req.user:', req.user?._id, req.user?.email);
//       console.log('  - req.artist:', req.artist?._id);
//       console.log('  - req.advertiser:', req.advertiser?._id);
//       console.log('  - req.auth:', req.auth?.kind, req.auth?.id);
      
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
    app.get("/confirmation/:artist_id_token", async (req, res) => {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      try {
        const decoded = jwt.verify(
          req.params.artist_id_token,
          process.env.JWT_SECRET_ARTIST
        );
        console.log(decoded);
        if (!decoded || !decoded.data || !decoded.data._id) {
          throw new Error("Invalid token structure");
        }
        const { _id } = decoded.data;
        await Artist.findByIdAndUpdate(_id, { confirmed: true });
        return res.redirect(`${frontendUrl}/artist/login`);
      } catch (e) {
        console.log("Error confirming email:", e);
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
      app.use(express.static(path.join(__dirname, "../client/dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../client/dist/index.html"));
      });
    }

   

    // Start the server
    httpServer.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error("Error starting Apollo Server:", error);
  }
};

// Call the function to start the Apollo Server
startApolloServer();
