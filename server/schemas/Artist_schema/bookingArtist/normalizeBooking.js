export const normalizeBookingForResponse = (booking) => {
  if (!booking) return booking;
  const copy = booking.toObject ? booking.toObject() : { ...booking };
  if (copy.status) copy.status = copy.status.toUpperCase();
  if (copy.eventType) copy.eventType = copy.eventType.toUpperCase();
  if (copy.budgetRange) {
    const budgetMap = {
      "500-1000": "RANGE_500_1000",
      "1000-3000": "RANGE_1000_3000",
      "3000-5000": "RANGE_3000_5000",
      "5000+": "RANGE_5000_PLUS",
      flexible: "FLEXIBLE",
    };
    copy.budgetRange = budgetMap[copy.budgetRange] || copy.budgetRange;
  }
  if (copy.setLength) {
    const lengthMap = {
      30: "MIN_30",
      60: "MIN_60",
      90: "MIN_90",
    };
    copy.setLength = lengthMap[copy.setLength] || copy.setLength;
  }
  if (copy.isChatEnabled !== undefined) {
    copy.isChatEnabled = !!copy.isChatEnabled;
  }
  if (copy.performanceType) {
    const perfMap = {
      DJ: "DJ",
      Live: "LIVE",
      Acoustic: "ACOUSTIC",
      "Backing-track": "BACKING_TRACK",
    };
    copy.performanceType = perfMap[copy.performanceType] || copy.performanceType;
  }
  return copy;
};
