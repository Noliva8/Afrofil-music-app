

import { FiChevronRight } from 'react-icons/fi';

const EventsSection = () => {
  const upcomingEvents = [
    { id: 1, artist: 'Burna Boy', date: 'Oct 15', location: 'Lagos', price: '$50+', image: 'https://example.com/burna-boy.jpg' },
    { id: 2, artist: 'Wizkid', date: 'Nov 2', location: 'Accra', price: '$40+', image: 'https://example.com/wizkid.jpg' },
    { id: 3, artist: 'Tiwa Savage', date: 'Dec 10', location: 'Nairobi', price: '$35+', image: 'https://example.com/tiwa.jpg' },
  ];

  return (
    <section className="events-section">
      <div className="section-header">
        <h2>Upcoming Concerts</h2>
        <button className="see-all">See all <FiChevronRight /></button>
      </div>

      <div className="events-grid">
        {upcomingEvents.map(event => (
          <div key={event.id} className="event-card">
            <div
              className="event-image"
              style={{ backgroundImage: `url(${event.image})` }}
            />
            <div className="event-details">
              <h3>{event.artist}</h3>
              <p>{event.date} • {event.location}</p>
              <span className="event-price">{event.price}</span>
              <button className="book-btn">Get Tickets</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EventsSection;
