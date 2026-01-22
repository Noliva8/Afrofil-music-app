import express from 'express';
import { buildDailyMix } from '../utils/aiMixService.js';

const router = express.Router();

router.get('/daily-mix', async (_req, res) => {
  try {
    const mix = await buildDailyMix();
    return res.json(mix);
  } catch (error) {
    console.error('Failed to build daily mix', error);
    return res.status(500).json({ message: 'Could not build daily mix' });
  }
});

export default router;
