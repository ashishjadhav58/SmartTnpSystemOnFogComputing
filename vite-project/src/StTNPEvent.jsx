import React, { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
export default function StTNPEvent() {
  const [events, setEvents] = useState([]);
const backendUrl = useSelector((state) => state.backend.backendUrl);
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.post(`${backendUrl}/api/tpoeventss`);
        setEvents(Array.isArray(res.data)? res.data:[]);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    fetchEvents();
  }, []);

  const upcoming = events.filter(ev => new Date(ev.eventDateTime) >= new Date());
  const completed = events.filter(ev => new Date(ev.eventDateTime) < new Date());

  const EventCard = ({ ev }) => (
    <div className="card m-2 p-3 shadow" style={{ width: "250px" }}>
      <h5>{ev.lectureName}</h5>
      <p><strong>Lecturer:</strong> {ev.lecturer}</p>
      <p><strong>Date:</strong> {new Date(ev.eventDateTime).toLocaleString()}</p>
      <p><strong>Venue:</strong> {ev.venue}</p>
      <p><strong>Status:</strong> {ev.status}</p>
      <p><strong>Description:</strong> {ev.description}</p>
    </div>
  );

  return (
    <div className="container text-center">
      <h4 className="mt-4">TPO Events</h4>

      {/* Upcoming Events */}
      <h5 className="text-start ms-3 mt-4">Upcoming Events</h5>
      <div className="d-flex flex-wrap justify-content-center">
        {upcoming.length > 0 ? upcoming.map(ev => <EventCard key={ev._id} ev={ev} />) : <p>No upcoming events.</p>}
      </div>

      {/* Completed Events */}
      <h5 className="text-start ms-3 mt-4">Completed Events</h5>
      <div className="d-flex flex-wrap justify-content-center">
        {completed.length > 0 ? completed.map(ev => <EventCard key={ev._id} ev={ev} />) : <p>No past events.</p>}
      </div>
    </div>
  );
}
