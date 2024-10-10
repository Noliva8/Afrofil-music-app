const { User, Matchup } = require('../models');

const resolvers = {
  Query: {

    users: async () => {
      const users = await User.find({}).populate('likedSongs').
      return User.find({});
    },








    matchups: async (parent, { _id }) => {
      const params = _id ? { _id } : {};
      return Matchup.find(params);
    },

  },
  Mutation: {
    createMatchup: async (parent, args) => {
      const matchup = await Matchup.create(args);
      return matchup;
    },
    createVote: async (parent, { _id, techNum }) => {
      const vote = await Matchup.findOneAndUpdate(
        { _id },
        { $inc: { [`tech${techNum}_votes`]: 1 } },
        { new: true }
      );
      return vote;
    },
  },
};

module.exports = resolvers;
