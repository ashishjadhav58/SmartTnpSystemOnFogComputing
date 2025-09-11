import React, { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
export default function TpoEvent() {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    lecturer: '',
    lectureName: '',
    eventDateTime: '',
    venue: '',
    description: '',
    status: 'Upcoming',
  });
const backendUrl = useSelector((state) => state.backend.backendUrl);
  const [editingEvent, setEditingEvent] = useState(null);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log(backendUrl);
        const res = await axios.post(`${backendUrl}/api/tpoeventss`);
        console.log(res);
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    fetchEvents();
  }, []);

  const handleChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditingEvent(prev => ({ ...prev, [name]: value }));
    } else {
      setNewEvent(prev => ({ ...prev, [name]: value }));
    }
  };

  const addEvent = async () => {
    try {
      const res = await axios.post(`${backendUrl}/api/tpoevents`, newEvent);
      setEvents(prev => [...prev, res.data]);
      setNewEvent({
        lecturer: '',
        lectureName: '',
        eventDateTime: '',
        venue: '',
        description: '',
        status: 'Upcoming',
      });
    } catch (err) {
      console.error("Error adding event:", err);
    }
  };

  const updateEvent = async () => {
    try {
      await axios.put(`${backendUrl}/api/tpoevents/${editingEvent._id}`, editingEvent);
      setEvents(prev => prev.map(ev => ev._id === editingEvent._id ? editingEvent : ev));
      setEditingEvent(null);
    } catch (err) {
      console.error("Error updating event:", err);
    }
  };

  const upcoming = events.filter(ev => new Date(ev.eventDateTime) >= new Date());
  const completed = events.filter(ev => new Date(ev.eventDateTime) < new Date());

  const EventCard = ({ ev }) => (
    <div className="card m-2 p-3 shadow" style={{ width: "250px", cursor: "pointer" }} onClick={() => setEditingEvent({ ...ev })}>
      <h5>{ev.lectureName}</h5>
      <p><strong>Lecturer:</strong> {ev.lecturer}</p>
      <p><strong>Date:</strong> {new Date(ev.eventDateTime).toLocaleString()}</p>
      <p><strong>Venue:</strong> {ev.venue}</p>
      <p><strong>Status:</strong> {ev.status}</p>
    </div>
  );

  return (
    <div className="container text-center">
      <h4 className="mt-4">TPO Events</h4>

      {/* Add Event */}
      <div className="card p-3 mb-4">
        <h5>Add New Event</h5>
        <div className="row">
          {["lectureName", "lecturer", "venue", "eventDateTime"].map((field, idx) => (
            <div className="col-md-4 mb-2" key={idx}>
              <input
                type={field === "eventDateTime" ? "datetime-local" : "text"}
                className="form-control"
                name={field}
                placeholder={field.replace(/([A-Z])/g, " $1")}
                value={newEvent[field]}
                onChange={handleChange}
              />
            </div>
          ))}
          <div className="col-12 mb-2">
            <textarea className="form-control" name="description" placeholder="Description" value={newEvent.description} onChange={handleChange}></textarea>
          </div>
          <div className="col-12">
            <button className="btn btn-primary" onClick={addEvent}>Add Event</button>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <h5 className="text-start ms-3">Upcoming Events</h5>
      <div className="d-flex flex-wrap justify-content-center">
        {upcoming.length > 0 ? upcoming.map(ev => <EventCard key={ev._id} ev={ev} />) : <p>No upcoming events.</p>}
      </div>

      {/* Completed Events */}
      <h5 className="text-start ms-3 mt-4">Completed Events</h5>
      <div className="d-flex flex-wrap justify-content-center">
        {completed.length > 0 ? completed.map(ev => <EventCard key={ev._id} ev={ev} />) : <p>No past events.</p>}
      </div>

      {/* Edit Modal */}
      {editingEvent && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog" role="document">
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title">Edit Event - {editingEvent.lectureName}</h5>
                <button type="button" className="btn-close" onClick={() => setEditingEvent(null)}></button>
              </div>
              <div className="modal-body">
                {["lectureName", "lecturer", "venue", "eventDateTime"].map((field, idx) => (
                  <div className="form-group mb-2" key={idx}>
                    <label>{field.replace(/([A-Z])/g, " $1")}</label>
                    <input
                      type={field === "eventDateTime" ? "datetime-local" : "text"}
                      className="form-control"
                      name={field}
                      value={field === "eventDateTime" ? editingEvent[field]?.split(".")[0] : editingEvent[field]}
                      onChange={(e) => handleChange(e, true)}
                    />
                  </div>
                ))}
                <div className="form-group mb-2">
                  <label>Description</label>
                  <textarea className="form-control" name="description" value={editingEvent.description} onChange={(e) => handleChange(e, true)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={updateEvent}>Save Changes</button>
                <button className="btn btn-secondary" onClick={() => setEditingEvent(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
