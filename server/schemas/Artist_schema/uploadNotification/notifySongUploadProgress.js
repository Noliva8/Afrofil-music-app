import { pubsub } from '../../utils/ pubsub.js';
import { AuthenticationError } from 'apollo-server-express';

const SONG_UPLOAD_UPDATE = 'SONG_UPLOAD_UPDATE';
const WORKER_NOTIFICATION_TOKEN = process.env.WORKER_NOTIFICATION_TOKEN;

export const notifySongUploadProgress = async (
  _parent,
  args,
  context = {}
) => {
  const {
    artistId,
    songId,
    status,
    step,
    message = null,
    percent = null,
    isComplete = false,
  } = args;

  if (!artistId || !songId) {
    throw new Error('artistId and songId are required');
  }

  if (!status) {
    throw new Error('status is required');
  }

  if (!step) {
    throw new Error('step is required');
  }

  if (WORKER_NOTIFICATION_TOKEN) {
    const authHeader =
      (context?.req?.headers?.authorization || context?.req?.headers?.Authorization || '').trim();
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader;

    if (!token || token !== WORKER_NOTIFICATION_TOKEN) {
      throw new AuthenticationError('Unauthorized upload notification');
    }
  }

  const payload = {
    artistId,
    songId,
    step,
    status,
    message,
    percent,
    isComplete: Boolean(isComplete),
  };

  await pubsub.publish(SONG_UPLOAD_UPDATE, {
    songUploadProgress: payload,
  });

  return payload;
};
