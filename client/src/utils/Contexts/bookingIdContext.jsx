import { createContext, useContext, useState } from "react";

const BookingIdContext = createContext(null);

export const BookingIdProvider = ({ children }) => {
  const [bookingId, setBookingId] = useState(null);
  return (
    <BookingIdContext.Provider value={{ bookingId, setBookingId }}>
      {children}
    </BookingIdContext.Provider>
  );
};

export const useBookingId = () => {
  const context = useContext(BookingIdContext);
  if (!context) {
    throw new Error("useBookingId must be used within BookingIdProvider.");
  }
  return context;
};
