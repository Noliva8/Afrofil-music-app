import Song from '../../models/Artist/Song.js';

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
    const candidateSongs = await Song.find({
      'audioHash.hash': { $in: uniqueHashes }
    }).limit(50); // Can be tuned based on system performance
    console.timeEnd('query_db');

    stage1Feedback.steps.push({
      step: 'candidate_search',
      status: candidateSongs.length > 0 ? 'matches_found' : 'no_matches',
      count: candidateSongs.length
    });

    if (candidateSongs.length === 0) {
      stage1Feedback.steps.push({
        step: 'final_result',
        status: 'no_matches',
        message: 'No existing matches found. This appears to be an original upload.',
        action: 'proceed_with_upload'
      });
      return stage1Feedback;
    }

    stage1Feedback.steps.push({
      step: 'detailed_analysis',
      status: 'started',
      message: `Analyzing ${candidateSongs.length} potential matches`
    });

    // STEP 2: Pre-filter candidates by shared hashes
    const queryHashSet = new Set(queryHashes);
    const candidatesWithScores = candidateSongs.map(song => {
      const dbHashSet = new Set(song.audioHash.map(fp => fp.hash));
      const sharedHashCount = [...queryHashSet].filter(hash => dbHashSet.has(hash)).length;
      return { song, sharedHashCount };
    });

    // Sort and take top N for deeper comparison
    const topCandidates = candidatesWithScores
      .sort((a, b) => b.sharedHashCount - a.sharedHashCount)
      .slice(0, 10);

    // STEP 3: Full match scoring
    console.time('score_calc');
    const matches = topCandidates.map(({ song }) => ({
      songId: song._id,
      score: this._calculateMatchScore(
        queryFingerprints,
        song.audioHash,
        { timeTolerance, hashTolerance }
      ),
      songData: {
        artist: song.artist,
        title: song.title
      }
    }));
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

    // STEP 5: Determine match types
    const copyrightMatches = filteredMatches.filter(
      match => match.songData.artist.toString() !== currentArtistId.toString()
    );

    const artistMatches = filteredMatches.filter(
      match => match.songData.artist.toString() === currentArtistId.toString()
    );

    const result = {
      steps: stage1Feedback.steps,
      matches: filteredMatches.map(match => ({
        songId: match.songId,
        title: match.songData.title,
        artist: match.songData.artist,
        matchScore: match.score,
        matchType:
          match.songData.artist.toString() === currentArtistId.toString()
            ? 'artist_duplicate'
            : 'copyright_match'
      })),
      finalDecision: {} // Initialize
    };

    // STEP 6: Set final decision
    if (artistMatches.length > 0) {
      result.finalDecision = {
        status: 'artist_duplicate',
        message: `A similar song was found in your catalog. You can go to your dashboard and edit the existing song if you want to replace it.`,
        action: 'reject_upload',
        duplicateSongId: artistMatches[0].songId
      };
      
    } else if (copyrightMatches.length > 0) {
      result.finalDecision = {
        status: 'copyright_issue',
        message: 'This song matches existing content by another artist',
        action: 'notify_user',
        options: [
          {
            label: 'Report as copyright infringement',
            action: 'report_copyright',
            endpoint: '/api/copyright/report'
          },
          {
            label: 'Contact support',
            action: 'contact_support',
            endpoint: '/api/support'
          },
          {
            label: 'Proceed anyway (for covers/licensed content)',
            action: 'proceed_with_warning',
            warning: 'Your upload may be reviewed manually'
          }
        ],
        matchingSongs: copyrightMatches.map(m => ({
          songId: m.songId,
          title: m.songData.title,
          artist: m.songData.artist,
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

    result.steps.push({
      step: 'final_result',
      status: result.finalDecision.status,
      message: result.finalDecision.message,
      action: result.finalDecision.action
    });

    return result;
  }

  static _calculateMatchScore(queryFingerprints, dbFingerprints, { timeTolerance, hashTolerance }) {
    const offsetHistogram = {};

    // Index dbFingerprints by hash bucket
    const dbMap = new Map();
    for (const dbFp of dbFingerprints) {
      for (let delta = -hashTolerance; delta <= hashTolerance; delta++) {
        const bucket = parseInt(dbFp.hash) + delta;
        if (!dbMap.has(bucket)) dbMap.set(bucket, []);
        dbMap.get(bucket).push(dbFp);
      }
    }

    let matches = 0;

    for (const qFp of queryFingerprints) {
      const qHash = parseInt(qFp.hash);
      const candidates = dbMap.get(qHash) || [];
      for (const dbFp of candidates) {
        const offset = Math.round(qFp.time - dbFp.time);
        if (Math.abs(offset) <= timeTolerance) {
          offsetHistogram[offset] = (offsetHistogram[offset] || 0) + 1;
          matches++;
          break;
        }
      }
    }

    // Find the offset with the most votes
    let bestOffset = 0;
    let maxCount = 0;
    for (const [offset, count] of Object.entries(offsetHistogram)) {
      if (count > maxCount) {
        maxCount = count;
        bestOffset = offset;
      }
    }

    return maxCount;
  }
}

export default FingerprintMatcher;
