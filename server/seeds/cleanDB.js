const models = require('../models');
const db = require('../config/connection');

module.exports = async (modelName) => {
  try {
    // Get the model from the models object
    const model = models[modelName];

    // Get the collection name
    const collectionName = model.collection.name;

    // Check if the collection exists
    const collections = await db.db.listCollections({ name: collectionName }).toArray();

    // If the collection exists, drop it
    if (collections.length) {
      console.log(`Dropping collection: ${collectionName}`);
      await db.db.dropCollection(collectionName);
      console.log(`Collection ${collectionName} dropped.`);
    } else {
      console.log(`Collection ${collectionName} does not exist.`);
    }
  } catch (err) {
    console.error(`Error dropping collection ${modelName}:`, err);
    throw err; // Re-throw to allow further handling if necessary
  }
};
