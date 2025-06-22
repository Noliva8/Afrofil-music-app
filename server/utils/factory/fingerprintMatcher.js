import Song from '../../models/Artist/Song.js';
import Fingerprint from '../../models/Artist/Fingeprints.js';



class FingerprintMatcher {
  static async findMatches(queryFingerprints, currentArtistId, options = {}) {
    const {
      minMatches = 5,
      timeTolerance = 2,
      hashTolerance = 2,
      limit = 5
    } = options;

    const stage1Feedback = { steps: [] };
    stage1Feedback.steps.push({
      step: 'initial_matching',
      status: 'started',
      message: 'Starting audio fingerprint analysis'
    });

    // STEP 1: Get unique hashes from query
    const queryHashes = queryFingerprints.map(fp => fp.hash);
    const uniqueHashes = [...new Set(queryHashes)];

    console.time('query_db');

    const matchingFingerprints = await Fingerprint.find({
      'audioHash.hash': { $in: uniqueHashes }
    })
     .populate({
  path: 'song',
  select: '_id artist title',
  populate: {
    path: 'artist',
    select: '_id artistAka email'  
  }
})


      
      .limit(50)
      .lean();

    console.timeEnd('query_db');

    // Filter out any fingerprints with missing song references
    const validFingerprints = matchingFingerprints.filter(fp => 
      fp.song && fp.song._id && fp.song.artist
    );

    stage1Feedback.steps.push({
      step: 'candidate_search',
      status: validFingerprints.length > 0 ? 'matches_found' : 'no_matches',
      count: validFingerprints.length
    });

    if (validFingerprints.length === 0) {
      stage1Feedback.steps.push({
        step: 'final_result',
        status: 'no_matches',
        message: 'No existing matches found. This appears to be an original upload.',
        action: 'proceed_with_upload'
      });
      return stage1Feedback;
    }

    // STEP 2: Pre-filter candidates by shared hashes
    const queryHashSet = new Set(queryHashes);
    const candidatesWithScores = validFingerprints.map(fp => {
      const dbHashSet = new Set(fp.audioHash.map(h => h.hash));
      let sharedCount = 0;
      
      queryHashSet.forEach(hash => {
        if (dbHashSet.has(hash)) sharedCount++;
      });

      return {
        song: fp.song,
        fingerprint: fp,
        sharedHashCount: sharedCount
      };
    });

    // STEP 3: Full match scoring
    console.time('score_calc');
    const matches = await Promise.all(
      candidatesWithScores
        .sort((a, b) => b.sharedHashCount - a.sharedHashCount)
        .slice(0, 10)
        .map(async ({ song, fingerprint }) => ({
          songId: song._id,
          score: this._calculateMatchScore(
            queryFingerprints,
            fingerprint.audioHash,
            { timeTolerance, hashTolerance }
          ),
          songData: {
  artistId: song.artist._id.toString(), 
  artistName: song.artist.artistAka,
  title: song.title
}
        }))
    );
    console.timeEnd('score_calc');





    // STEP 4: Filter by minimum match score
    const filteredMatches = matches
      .filter(match => match.score >= minMatches)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (filteredMatches.length === 0) {
      stage1Feedback.steps.push({
        step: 'final_result',
        status: 'no_confirmed_matches',
        message: 'No strong matches found. Proceeding with upload.',
        action: 'proceed_with_upload'
      });
      return stage1Feedback;
    }



// STEP 5: Determine match types using artistId
const copyrightMatches = filteredMatches.filter(
  match => match.songData.artistId !== currentArtistId.toString()
);
const artistMatches = filteredMatches.filter(
  match => match.songData.artistId === currentArtistId.toString()
);

console.log('see if artistMatches is valid:', artistMatches);

// STEP 6: Build the result object
const result = {
  steps: stage1Feedback.steps,
  matches: filteredMatches.map(match => ({
    songId: match.songId,
    title: match.songData.title,
    artistName: match.songData.artistName,   // display name
    matchScore: match.score,
    matchType:
      match.songData.artistId === currentArtistId.toString()
        ? 'artist_duplicate'
        : 'copyright_match'
  })),
  finalDecision: {}
};

// STEP 7: Set final decision
if (artistMatches.length > 0) {
  result.finalDecision = {
    status: 'artist_duplicate',
    message: 'A similar song was found in your catalog. You can edit the existing song if you want to replace it.',
    action: 'reject_upload',
    duplicateSongId: artistMatches[0].songId
  };
} else if (copyrightMatches.length > 0) {
  result.finalDecision = {
    status: 'copyright_issue',
    message: 'This song matches existing content by another artist',
    action: 'notify_user',
    options: [
      { label: 'Report as copyright infringement', action: 'report_copyright', endpoint: '/api/copyright/report' },
      { label: 'Contact support', action: 'contact_support', endpoint: '/api/support' },
      { label: 'Proceed anyway (for covers/licensed content)', action: 'proceed_with_warning', warning: 'Your upload may be reviewed manually' }
    ],
    matchingSongs: copyrightMatches.map(m => ({
      songId: m.songId,
      title: m.songData.title,
      artistName: m.songData.artistName,
      score: m.score
    }))
  };
} else {
  result.finalDecision = {
    status: 'no_matches',
    message: 'No matches found',
    action: 'proceed_with_upload'
  };
}

// Final step
result.steps.push({
  step: 'final_result',
  status: result.finalDecision.status,
  message: result.finalDecision.message,
  action: result.finalDecision.action
});

return result;
  }

  // Optimized scoring function
  static _calculateMatchScore(queryFingerprints, dbFingerprints, { timeTolerance, hashTolerance }) {
    const offsetHistogram = new Map();

    // Pre-index db fingerprints by hash range
    const dbHashMap = new Map();
    dbFingerprints.forEach(dbFp => {
      const hash = parseInt(dbFp.hash);
      for (let delta = -hashTolerance; delta <= hashTolerance; delta++) {
        const bucket = hash + delta;
        if (!dbHashMap.has(bucket)) dbHashMap.set(bucket, []);
        dbHashMap.get(bucket).push(dbFp);
      }
    });

    let matches = 0;

    // Compare each query fingerprint
    queryFingerprints.forEach(qFp => {
      const qHash = parseInt(qFp.hash);
      const candidates = dbHashMap.get(qHash) || [];
      
      for (const dbFp of candidates) {
        const offset = Math.round(qFp.time - dbFp.time);
        if (Math.abs(offset) <= timeTolerance) {
          offsetHistogram.set(offset, (offsetHistogram.get(offset) || 0) + 1);
          matches++;
          break;
        }
      }
    });

    // Find best offset
    let bestOffset = 0;
    let maxCount = 0;
    offsetHistogram.forEach((count, offset) => {
      if (count > maxCount) {
        maxCount = count;
        bestOffset = offset;
      }
    });

    return maxCount;
  }
}

export default FingerprintMatcher;