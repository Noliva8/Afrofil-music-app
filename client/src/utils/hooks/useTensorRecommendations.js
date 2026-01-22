import { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const tempoScores = {
  fast: 1,
  medium: 0.6,
  varied: 0.7,
  slow: 0.3,
};

const moodScores = {
  party: 1,
  chill: 0.6,
  love: 0.6,
  focus: 0.5,
  workout: 0.8,
  spiritual: 0.4,
  street: 0.7,
  sad: 0.35,
  happy: 0.9,
  night: 0.4,
  relaxed: 0.45,
  calm: 0.5,
};

const getTempoScore = (tempo) => {
  if (typeof tempo === 'number' && !Number.isNaN(tempo)) {
    // normalize beat per minute to 0-1 range (assume 40-200 bps)
    const clamped = Math.min(200, Math.max(40, tempo));
    return (clamped - 40) / 160;
  }
  if (typeof tempo === 'string') {
    const key = tempo.toLowerCase().trim();
    return tempoScores[key] ?? 0.55;
  }
  return 0.55;
};

const getMoodScore = (mood) => {
  if (!mood) return 0.5;
  if (Array.isArray(mood)) {
    const values = mood.map((entry) => getMoodScore(entry));
    return values.reduce((acc, value) => acc + value, 0) / Math.max(values.length, 1);
  }
  const key = String(mood).toLowerCase().trim();
  return moodScores[key] ?? 0.5;
};

const getPopularityScore = (value) => {
  const count = Number(value) || 0;
  if (count <= 0) return 0.25;
  return Math.min(1, Math.log2(count + 1) / 10 + 0.25);
};

const getSongVector = (song) => {
  if (!song) return null;
  const tempoScore = getTempoScore(song.tempo);
  const moodScore = getMoodScore(song.mood || song.subMoods);
  const popularityScore = getPopularityScore(song.playCount ?? song.plays ?? song.downloadCount);

  return [tempoScore, moodScore, popularityScore];
};

const averageVectors = (vectors) => {
  if (!vectors.length) return [0.6, 0.5, 0.3];
  const sums = vectors.reduce(
    (acc, vector) => {
      acc[0] += vector[0];
      acc[1] += vector[1];
      acc[2] += vector[2];
      return acc;
    },
    [0, 0, 0]
  );

  const count = vectors.length;
  return [sums[0] / count, sums[1] / count, sums[2] / count];
};

const getScore = (trackVector, profileVector) => {
  return tf.tidy(() => {
    const trackTensor = tf.tensor1d(trackVector);
    const profileTensor = tf.tensor1d(profileVector);
    const dot = profileTensor.dot(trackTensor);
    const value = dot.arraySync();
    trackTensor.dispose();
    profileTensor.dispose();
    return Number(parseFloat(value).toFixed(3));
  });
};

const computeRecommendations = (candidates, recentSongs, limit) => {
  if (!candidates.length) return [];

  const recentVectors = (recentSongs || [])
    .map(getSongVector)
    .filter(Boolean);

  const profileVector = averageVectors(recentVectors.length ? recentVectors : [[0.6, 0.5, 0.3]]);
  const recentIds = new Set(
    (recentSongs || [])
      .map((song) => String(song?._id ?? song?.id ?? song?.songId ?? ''))
      .filter(Boolean)
  );

  const scored = candidates
    .filter((song) => song && song._id && !recentIds.has(String(song._id)))
    .map((song) => {
      const vector = getSongVector(song);
      if (!vector) return null;
      const score = getScore(vector, profileVector);
      return { song, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.song);

  return scored;
};

export const useTensorRecommendations = (candidates = [], recentSongs = [], limit = 8) => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (!candidates.length) {
      setRecommendations([]);
      return;
    }

    let handle;
    let canceled = false;

    const run = () => {
      if (canceled) return;
      const result = computeRecommendations(candidates, recentSongs, limit);
      if (!canceled) setRecommendations(result);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      handle = window.requestIdleCallback(run, { timeout: 300 });
    } else {
      handle = setTimeout(run, 0);
    }

    return () => {
      canceled = true;
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && handle) {
        window.cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, [candidates, JSON.stringify(recentSongs.map((song) => song?._id ?? song?.id ?? song?.songId ?? '')), limit]);

  return recommendations;
};
