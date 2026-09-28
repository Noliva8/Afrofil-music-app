import { GraphQLError } from 'graphql';
import { Artist } from '../../../models/Artist/index_artist.js';
import { getAdvertiserFromContext, isAdminAdvertiser } from '../../../utils/advertiserContext.js';

const DEFAULT_LIMIT = 20;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toDashboardArtistRow = (artist) => {
  const id = String(artist._id);
  const isProfileComplete = Boolean(artist.isProfileComplete);

  return {
    id,
    _id: id,
    fullName: artist.fullName || '',
    artistAka: artist.artistAka || '',
    email: artist.email || '',
    region: artist.region || '',
    country: artist.country || '',
    isPlofileComplete: isProfileComplete,
    isProfileComplete,
    isVerified: Boolean(artist.confirmed),
    createdAt: artist.createdAt,
  };
};

const dashboardArtists = async (_parent, { page = 1 } = {}, context = {}) => {
  const advertiser = getAdvertiserFromContext(context);

  if (!advertiser) {
    throw new GraphQLError('Could not authenticate advertiser', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  if (!isAdminAdvertiser(advertiser)) {
    throw new GraphQLError('Only admin, owner, or super admin advertisers can view artists', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  const currentPage = toPositiveInt(page, 1);
  const pageLimit = DEFAULT_LIMIT;
  const skip = (currentPage - 1) * pageLimit;

  const [artists, totalArtists] = await Promise.all([
    Artist.find({})
      .select('_id fullName artistAka email region country isProfileComplete confirmed createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    Artist.countDocuments({}),
  ]);

  const totalPages = Math.ceil(totalArtists / pageLimit);

  return {
    artists: artists.map(toDashboardArtistRow),
    page: currentPage,
    limit: pageLimit,
    totalArtists,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};

export default dashboardArtists;
