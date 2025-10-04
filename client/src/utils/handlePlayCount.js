import { INCREMENT_PLAY_COUNT } from "./mutations";
import { useMutation } from "@apollo/client";


export const usePlayCount = () => {
  const [handlePlayCount, { loading, error }] = useMutation(INCREMENT_PLAY_COUNT);

  const incrementPlayCount = async (songId) => {
    try {
      await handlePlayCount({
        variables: { songId }
      });
      console.log(`Play count incremented for song: ${songId}`);
      return true;
    } catch (err) {
      console.warn('Failed to increment play count:', err);
      return false;
    }
  };

  return { incrementPlayCount, loading, error };
};