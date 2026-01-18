import mongoose from "mongoose";
import connectDB from "../config/connection.js";
import { RadioStation, Artist } from "../models/Artist/index_artist.js";
import { RADIO_TYPES } from "../utils/radioTypes.js";

const buildStations = (artists) => {
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
    const mainArtist = artists[0];
    stations.push({
      name: `Artist Radio: ${mainArtist.artistAka || "Featured"}`,
      description: "Based on a standout Afrofeel artist.",
      type: RADIO_TYPES.ARTIST_RADIO,
      seeds: [{ seedType: "artist", seedId: String(mainArtist._id) }],
    });
  }

  return stations;
};

const run = async () => {
  try {
    await connectDB();
    const artists = await Artist.find().select("_id artistAka").limit(1).lean();
    const stations = buildStations(artists || []);

    for (const station of stations) {
      await RadioStation.findOneAndUpdate(
        { name: station.name },
        {
          ...station,
          visibility: "public",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`Seeded ${stations.length} radio stations.`);
  } catch (error) {
    console.error("Failed to seed radio stations:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
