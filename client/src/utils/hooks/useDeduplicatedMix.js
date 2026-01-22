import { useMemo, useState, useEffect, useRef} from 'react';
import { dedupeSongs } from '../songHelpers';
import { generateDailyMix } from '../aiMix';

export const useDeduplicatedMix = (dailyMixData, recentPlayedData) => {
  const [isProcessing, setIsProcessing] = useState(true);

  const {
    mixProfileLabel,
    visibleMixQueue,
    recentSongs,
    isReady,
    hasData,
  } = useMemo(() => {
    if (!dailyMixData || !recentPlayedData) {
      return {
        mixProfileLabel: 'AI Daily Mix',
        visibleMixQueue: [],
        recentSongs: [],
        isReady: false,
        hasData: false,
      };
    }

    const fallbackDailyMix = generateDailyMix();
    const apiMix = dailyMixData?.dailyMix;
    const mixToDisplay = apiMix ?? fallbackDailyMix;
    const mixTracks = mixToDisplay?.tracks ?? fallbackDailyMix.tracks;
    const safeRecentSongs = dedupeSongs(recentPlayedData?.recentPlayedSongs ?? []);

    const getSongId = (song) => String(song?._id ?? song?.id ?? song?.songId ?? '');
    const recentIds = new Set(safeRecentSongs.map((song) => getSongId(song)).filter(Boolean));
    const filteredMixQueue = mixTracks.filter((track) => {
      const id = getSongId(track);
      return id && !recentIds.has(id);
    });

    const MIN_DAILY_MIX_SONGS = 8;
    const fillQueueToMinimum = (baseQueue = [], extraPool = []) => {
      const queue = [...baseQueue];
      const usedIds = new Set(queue.map((track) => getSongId(track)).filter(Boolean));

      for (const track of extraPool) {
        if (queue.length >= MIN_DAILY_MIX_SONGS) break;
        const id = getSongId(track);
        if (!id || usedIds.has(id) || recentIds.has(id)) continue;
        usedIds.add(id);
        queue.push(track);
      }

      if (queue.length >= MIN_DAILY_MIX_SONGS) {
        return queue;
      }

      for (const track of fallbackDailyMix.tracks ?? []) {
        if (queue.length >= MIN_DAILY_MIX_SONGS) break;
        const id = getSongId(track);
        if (!id || usedIds.has(id) || recentIds.has(id)) continue;
        usedIds.add(id);
        queue.push(track);
      }

      return queue;
    };

    const baseQueue = filteredMixQueue.length ? filteredMixQueue : mixTracks;
    const visibleMixQueue = fillQueueToMinimum(baseQueue, mixTracks);

    return {
      mixProfileLabel: mixToDisplay?.profileLabel ?? fallbackDailyMix.profileLabel ?? 'AI Daily Mix',
      visibleMixQueue,
      recentSongs: safeRecentSongs,
      isReady: true,
      hasData: true,
    };
  }, [dailyMixData, recentPlayedData]);

  useEffect(() => {
    if (dailyMixData && recentPlayedData) {
      const timer = setTimeout(() => setIsProcessing(false), 100);
      return () => clearTimeout(timer);
    }
    setIsProcessing(true);
  }, [dailyMixData, recentPlayedData]);

  return {
    isProcessing,
    mixProfileLabel,
    visibleMixQueue,
    recentSongs,
    isReady,
    hasData,
  };
};



