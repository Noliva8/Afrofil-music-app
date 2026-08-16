import Ad from '../models/Advertizer/Ad.js';

 const cleanupAbandonedDrafts = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1); // Delete drafts older than 1 day

    const result = await Ad.deleteMany({
      status: 'draft',
      isCostConfirmed: false,
      createdAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up abandoned draft ads:', error);
  }
};

// Run the cleanup function periodically (e.g., every 24 hours)
setInterval(cleanupAbandonedDrafts, 24 * 60 * 60 * 1000);  // 24 hours in milliseconds

export default cleanupAbandonedDrafts;
