import React, { useEffect, useState } from 'react';
// Removed react-bootstrap due to bundling errors

  import { useSelector } from "react-redux";
export default function StSelfattendence() {
  const backendUrl = useSelector((state) => state.backend.backendUrl);
  const [todayEvents, setTodayEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ views: "", feedback: "", suggestion: "" });

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    axios.post(`${backendUrl}/api/tpoeventss`)
      .then(res => {
        const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        const filteredEvents = res.data.filter(event => {
          const eventDate = new Date(event.eventDateTime).toISOString().slice(0, 10);
          return eventDate === today;
        });

        setTodayEvents(filteredEvents);
      })
      .catch(err => console.error("Error fetching events:", err));
  }, []);

  const handleAttendanceClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const attendanceData = {
      userEmail: user.email,
      eventId: selectedEvent._id,
      eventName: selectedEvent.name,
      ...form,
      markedAt: new Date().toISOString(),
    };

    axios.post(`${backendUrl}/api/attendance`, attendanceData)
      .then(() => {
        alert("Attendance marked successfully!");
        setShowModal(false);
        setForm({ views: "", feedback: "", suggestion: "" });
      })
      .catch((err) => {
        console.error("Attendance submission error:", err);
        alert("Failed to mark attendance.");
      });
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Today's TPO Events</h2>

      {todayEvents.length === 0 ? (
        <p className="text-center">No events scheduled for today.</p>
      ) : (
        todayEvents.map((event, index) => (
          <div key={index} className="card text-center mb-4 p-3 mx-auto" style={{ maxWidth: "500px" }}>
            <h4>{event.name}</h4>
            <p>{new Date(event.eventDateTime).toLocaleString()}</p>
            <button className="btn btn-success" onClick={() => handleAttendanceClick(event)}>
              Mark as Attended
            </button>
          </div>
        ))
      )}

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Feedback for: {selectedEvent?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Your Views</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="views"
                value={form.views}
                onChange={handleFormChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Feedback</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="feedback"
                value={form.feedback}
                onChange={handleFormChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Suggestions</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="suggestion"
                value={form.suggestion}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit">
              Present
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
