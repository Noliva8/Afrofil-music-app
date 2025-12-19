import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { HANDLE_ARTIST_DOWNLOAD } from '../../mutations';
import { useUser } from '../userContext';

// Lightweight hook to record an artist download (premium only on server)
export const useArtistDownload = () => {
  const { user } = useUser();
  const [mutate, { loading, error, data }] = useMutation(HANDLE_ARTIST_DOWNLOAD);

  const recordDownload = useCallback(
    async ({ artistId, userId, role }) => {
      const uid = userId || user?._id;
      if (!artistId || !uid) return null;

      // Normalize role so the server accepts it
      const rawRole = (role || user?.plan || user?.role || '').toString().toLowerCase();
      const normalizedRole = rawRole.includes('premium') ? 'premium' : rawRole || 'free';

      const { data: resp } = await mutate({
        variables: { artistId, userId: uid, role: normalizedRole },
      });
      return resp?.handleArtistDownloadCounts?.artistDownloadCounts ?? null;
    },
    [mutate, user?._id, user?.plan, user?.role]
  );

  return {
    recordDownload,
    loading,
    error,
    artistDownloadCounts: data?.handleArtistDownloadCounts?.artistDownloadCounts ?? null,
  };
};

export default useArtistDownload;
