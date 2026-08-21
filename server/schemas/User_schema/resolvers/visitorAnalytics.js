import { GraphQLError } from 'graphql';
import { User, Visitor, Visit } from '../../../models/User/user_index.js';
import {getWeekStart} from '../../Artist_schema/generalDashboard/artistDashboardStats.js';


const VISIT_INACTIVITY_MS = 30 * 60 * 1000;
const VISITOR_ANALYTICS_DEBUG = process.env.VISITOR_ANALYTICS_DEBUG === 'true';

const visitorDebug = (event, details = {}) => {
  if (!VISITOR_ANALYTICS_DEBUG) return;
  console.info('[visitorAnalytics]', event, details);
};

const toDebugId = (value) => (value ? String(value) : null);

// const getWeekStart = (date = new Date()) => {
//   const weekStart = new Date(date);
//   const day = weekStart.getDay();
//   weekStart.setDate(weekStart.getDate() - day);
//   weekStart.setHours(0, 0, 0, 0);
//   return weekStart;
// };

const normalizeVisitorId = (visitorId) => String(visitorId || '').trim();

const calculateChangePercent = (current, previous) => {
  if (previous > 0) return ((current - previous) / previous) * 100;
  return current > 0 ? 100 : 0;
};

const formatBusiestDay = (dateKey) => {
  if (!dateKey) return null;

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return dateKey;

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

const formatDayLabel = (dateKey) => {
  if (!dateKey) return '';

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return dateKey;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};


const distinctVisitorCount = async (filter) => {
  const visitorIds = await Visit.distinct('visitorId', filter);
  return visitorIds.length;
};

const inferConversionType = ({ isNewUser, user, visit, now }) => {
  if (isNewUser) return 'NEW_USER';

  const userCreatedAt = user?.createdAt ? new Date(user.createdAt) : null;
  const visitStartedAt = visit?.startedAt ? new Date(visit.startedAt) : null;

  if (
    userCreatedAt &&
    visitStartedAt &&
    !Number.isNaN(userCreatedAt.getTime()) &&
    !Number.isNaN(visitStartedAt.getTime()) &&
    userCreatedAt >= visitStartedAt &&
    userCreatedAt <= now
  ) {
    return 'NEW_USER';
  }

  return 'EXISTING_USER';
};

const findAttachableVisit = async ({ visitorId, visitId }) => {
  if (visitId) {
    const visit = await Visit.findOne({ _id: visitId, visitorId }).lean();
    if (visit) return visit;
  }

  return Visit.findOne({ visitorId, endedAt: null })
    .sort({ lastSeenAt: -1 })
    .lean();
};




export const startVisitorVisit = async (_parent, { visitorId }, context = {}) => {
  const normalizedVisitorId = normalizeVisitorId(visitorId);

  visitorDebug('startVisitorVisit:received', {
    rawVisitorId: visitorId,
    normalizedVisitorId,
    hasAuthenticatedUser: Boolean(context.user?._id),
    authenticatedUserId: toDebugId(context.user?._id),
  });



  if (!normalizedVisitorId) {
    visitorDebug('startVisitorVisit:rejected', {
      reason: 'visitorId is required',
      rawVisitorId: visitorId,
    });
    throw new GraphQLError('visitorId is required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const now = new Date();
  const activeCutoff = new Date(now.getTime() - VISIT_INACTIVITY_MS);
  const previousVisitor = VISITOR_ANALYTICS_DEBUG
    ? await Visitor.findOne({ visitorId: normalizedVisitorId }).select('_id userId firstSeenAt lastSeenAt conversionType').lean()
    : null;

  const visitor = await Visitor.findOneAndUpdate(
    { visitorId: normalizedVisitorId },
    {
      $setOnInsert: { firstSeenAt: now },
      $set: { lastSeenAt: now },
    },
    { new: true, upsert: true }
  );

  visitorDebug('startVisitorVisit:visitorSaved', {
    visitorId: normalizedVisitorId,
    visitorDocumentId: toDebugId(visitor._id),
    visitorAlreadyExisted: Boolean(previousVisitor),
    existingUserId: toDebugId(visitor.userId),
    firstSeenAt: visitor.firstSeenAt,
    lastSeenAt: visitor.lastSeenAt,
    conversionType: visitor.conversionType,
  });

  const activeVisit = await Visit.findOneAndUpdate(
    {
      visitorId: normalizedVisitorId,
      lastSeenAt: { $gte: activeCutoff },
      endedAt: null,
    },
    {
      $set: {
        lastSeenAt: now,
        userId: visitor.userId || null,
        isAnonymous: !visitor.userId,
        ...(visitor.userId
          ? {
              conversionType: visitor.conversionType || 'EXISTING_USER',
              convertedAt: now,
            }
          : {}),
      },
    },
    { new: true, sort: { lastSeenAt: -1 } }
  );

  if (activeVisit) {
    visitorDebug('startVisitorVisit:activeVisitReused', {
      visitorId: normalizedVisitorId,
      visitId: toDebugId(activeVisit._id),
      userId: toDebugId(activeVisit.userId),
      startedAt: activeVisit.startedAt,
      lastSeenAt: activeVisit.lastSeenAt,
      startedAnonymous: activeVisit.startedAnonymous,
      isAnonymous: activeVisit.isAnonymous,
      conversionType: activeVisit.conversionType,
      activeCutoff,
    });

    return {
      visitorId: normalizedVisitorId,
      visitId: activeVisit._id,
    };
  }

  const visit = await Visit.create({
    visitorId: normalizedVisitorId,
    userId: visitor.userId || null,
    startedAt: now,
    lastSeenAt: now,
    startedAnonymous: !visitor.userId,
    isAnonymous: !visitor.userId,
    conversionType: visitor.userId ? 'EXISTING_USER' : 'ANONYMOUS',
  });

  visitorDebug('startVisitorVisit:newVisitCreated', {
    visitorId: normalizedVisitorId,
    visitId: toDebugId(visit._id),
    userId: toDebugId(visit.userId),
    startedAt: visit.startedAt,
    lastSeenAt: visit.lastSeenAt,
    startedAnonymous: visit.startedAnonymous,
    isAnonymous: visit.isAnonymous,
    conversionType: visit.conversionType,
  });

  return {
    visitorId: normalizedVisitorId,
    visitId: visit._id,
  };
};


export const attachVisitorToUser = async (_parent, { visitorId, visitId, isNewUser }, context) => {
  visitorDebug('attachVisitorToUser:received', {
    rawVisitorId: visitorId,
    normalizedVisitorId: normalizeVisitorId(visitorId),
    visitId: toDebugId(visitId),
    isNewUser,
    hasAuthenticatedUser: Boolean(context.user?._id),
    authenticatedUserId: toDebugId(context.user?._id),
  });

  if (!context.user?._id) {
    visitorDebug('attachVisitorToUser:rejected', {
      reason: 'User login required to attach visitor analytics',
      rawVisitorId: visitorId,
      visitId: toDebugId(visitId),
    });
    throw new GraphQLError('User login required to attach visitor analytics', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const normalizedVisitorId = normalizeVisitorId(visitorId);
  if (!normalizedVisitorId) {
    visitorDebug('attachVisitorToUser:rejected', {
      reason: 'visitorId is required',
      rawVisitorId: visitorId,
      visitId: toDebugId(visitId),
    });
    throw new GraphQLError('visitorId is required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const now = new Date();
  const userId = context.user._id;
  const [user, existingVisit] = await Promise.all([
    User.findById(userId).select('createdAt').lean(),
    findAttachableVisit({ visitorId: normalizedVisitorId, visitId }),
  ]);
  const conversionType = inferConversionType({
    isNewUser,
    user,
    visit: existingVisit,
    now,
  });
  const previousVisitor = VISITOR_ANALYTICS_DEBUG
    ? await Visitor.findOne({ visitorId: normalizedVisitorId }).select('_id userId firstSeenAt lastSeenAt conversionType becameUserAt').lean()
    : null;

  const visitor = await Visitor.findOneAndUpdate(
    { visitorId: normalizedVisitorId },
    {
      $setOnInsert: { firstSeenAt: now },
      $set: {
        userId,
        lastSeenAt: now,
        conversionType,
        becameUserAt: now,
      },
    },
    { new: true, upsert: true }
  );

  visitorDebug('attachVisitorToUser:visitorAttached', {
    visitorId: normalizedVisitorId,
    visitorDocumentId: toDebugId(visitor._id),
    visitorAlreadyExisted: Boolean(previousVisitor),
    previousUserId: toDebugId(previousVisitor?.userId),
    attachedUserId: toDebugId(userId),
    conversionType,
    becameUserAt: visitor.becameUserAt,
  });

  const visitFilter = existingVisit
    ? { _id: existingVisit._id, visitorId: normalizedVisitorId }
    : { visitorId: normalizedVisitorId, endedAt: null };

  visitorDebug('attachVisitorToUser:visitLookup', {
    visitorId: normalizedVisitorId,
    visitId: toDebugId(visitId),
    visitFilter,
  });

  const visit = await Visit.findOneAndUpdate(
    visitFilter,
    {
      $set: {
        userId,
        lastSeenAt: now,
        isAnonymous: false,
        conversionType,
        convertedAt: now,
      },
    },
    { new: true, sort: { lastSeenAt: -1 } }
  );

  if (!visit) {
    const createdVisit = await Visit.create({
      visitorId: normalizedVisitorId,
      userId,
      startedAt: now,
      lastSeenAt: now,
      startedAnonymous: false,
      isAnonymous: false,
      conversionType,
      convertedAt: now,
    });

    visitorDebug('attachVisitorToUser:fallbackVisitCreated', {
      visitorId: normalizedVisitorId,
      visitId: toDebugId(createdVisit._id),
      userId: toDebugId(createdVisit.userId),
      startedAt: createdVisit.startedAt,
      lastSeenAt: createdVisit.lastSeenAt,
      startedAnonymous: createdVisit.startedAnonymous,
      isAnonymous: createdVisit.isAnonymous,
      conversionType: createdVisit.conversionType,
      convertedAt: createdVisit.convertedAt,
    });

    return true;
  }

  visitorDebug('attachVisitorToUser:visitAttached', {
    visitorId: normalizedVisitorId,
    visitId: toDebugId(visit._id),
    userId: toDebugId(visit.userId),
    startedAt: visit.startedAt,
    lastSeenAt: visit.lastSeenAt,
    startedAnonymous: visit.startedAnonymous,
    isAnonymous: visit.isAnonymous,
    conversionType: visit.conversionType,
    convertedAt: visit.convertedAt,
  });

  return true;
};






export const visitorAnalyticsStats = async () => {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const thisWeekFilter = {
    startedAt: { $gte: weekStart, $lte: now },
  };
  const previousWeekFilter = {
    startedAt: { $gte: previousWeekStart, $lt: weekStart },
  };

  const [
    totalVisitors,
    totalVisits,
    visitsThisWeek,
    previousWeekVisits,
    uniqueVisitors,
    anonymousVisitors,
    eligibleAnonymousVisitorIds,
    existingAccountVisitorIds,
    newVisitors,
    thisWeekVisitorIds,
    convertedVisitors,
    busiestDayResult,
    dailyVisitResults,
  ] = await Promise.all([
    Visitor.countDocuments(),
    Visit.countDocuments(),
    Visit.countDocuments(thisWeekFilter),
    Visit.countDocuments(previousWeekFilter),
    distinctVisitorCount(thisWeekFilter),
    Visitor.countDocuments({ userId: null }),
    Visit.distinct('visitorId', {
      ...thisWeekFilter,
      startedAnonymous: true,
    }),
    Visitor.distinct('visitorId', {
      conversionType: 'EXISTING_USER',
    }),
    Visitor.countDocuments({
      firstSeenAt: { $gte: weekStart, $lte: now },
    }),
    Visit.distinct('visitorId', thisWeekFilter),
    Visitor.countDocuments({
      conversionType: 'NEW_USER',
      becameUserAt: { $gte: weekStart, $lte: now },
    }),
    Visit.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startedAt',
            },
          },
          visits: { $sum: 1 },
        },
      },
      { $sort: { visits: -1, _id: 1 } },
      { $limit: 1 },
    ]),
    Visit.aggregate([
      { $match: thisWeekFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startedAt',
            },
          },
          visits: { $sum: 1 },
          visitorIds: { $addToSet: '$visitorId' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const returningVisitors = await Visitor.countDocuments({
    visitorId: { $in: thisWeekVisitorIds },
    firstSeenAt: { $lt: weekStart },
  });
  const existingAccountVisitorIdSet = new Set(existingAccountVisitorIds);
  const eligibleAnonymousVisitors = eligibleAnonymousVisitorIds.filter(
    (visitorId) => !existingAccountVisitorIdSet.has(visitorId)
  ).length;
  const busiestDay = busiestDayResult[0] || null;
  const dailyVisits = dailyVisitResults.map((day) => ({
    date: day._id,
    label: formatDayLabel(day._id),
    visits: day.visits,
    uniqueVisitors: day.visitorIds?.length || 0,
  }));

  return {
    visits: totalVisits,
    visitsThisWeek,
    previousWeekVisits,
    visitsChangePercent: calculateChangePercent(visitsThisWeek, previousWeekVisits),
    uniqueVisitors,
    anonymousVisitors,
    newUsers: convertedVisitors,
    visitorToSignupRate: eligibleAnonymousVisitors > 0 ? (convertedVisitors / eligibleAnonymousVisitors) * 100 : 0,
    totalVisitors,
    newVisitors,
    returningVisitors,
    convertedVisitors,
    eligibleAnonymousVisitors,
    conversionRate: eligibleAnonymousVisitors > 0 ? (convertedVisitors / eligibleAnonymousVisitors) * 100 : 0,
    totalVisits,
    busiestDay: formatBusiestDay(busiestDay?._id),
    busiestDayVisits: busiestDay?.visits || 0,
    dailyVisits,
    hasPreviousWeekData: previousWeekVisits > 0,
  };
};
