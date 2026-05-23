import models from '../models/index.js';
import db from '../config/connection.js';

const dropCollection = async (modelName) => {
  try {
    // Get the model from the models object
    const model = models[modelName];

    // Get the collection name
    const collectionName = model.collection.name;

    // Check if the collection exists
    const collections = await db.db.listCollections({ name: collectionName }).toArray();

    // If the collection exists, drop it
    if (collections.length) {
      await db.db.dropCollection(collectionName);
    } else {
    }
  } catch (err) {
    console.error(`Error dropping collection ${modelName}:`, err);
    throw err; // Re-throw to allow further handling if necessary
  }
};

export default dropCollection;