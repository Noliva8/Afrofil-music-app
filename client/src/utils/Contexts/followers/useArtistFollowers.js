import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { HANDLE_FOLLOWERS } from '../../mutations';

// Toggle follow/unfollow and return the new follower count
export const useArtistFollowers = () => {
  const [mutate, { loading, error, data }] = useMutation(HANDLE_FOLLOWERS);

  const toggleFollow = useCallback(
    async ({ artistId, userId }) => {
      if (!artistId || !userId) return null;
      const { data: resp } = await mutate({
        variables: { artistId, userId },
      });
      return resp?.handleFollowers?.followerCount ?? null;
    },
    [mutate]
  );

  return {
    toggleFollow,
    loading,
    error,
    followerCount: data?.handleFollowers?.followerCount ?? null,
  };
};

export default useArtistFollowers;
