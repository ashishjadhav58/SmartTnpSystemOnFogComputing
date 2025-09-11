import React, { useState } from 'react';

  import { useSelector } from "react-redux";
export default function CTAttendence() {
  const backendUrl = useSelector((state) => state.backend.backendUrl);
  const [date, setDate] = useState('');
  const [records, setRecords] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleShowAttendance = async () => {
    if (!date) {
      alert("Please select a date!");
      return;
    }

    try {
      const res = await axios.post(`${backendUrl}/api/attendance/all`);
      const formattedDate = new Date(date).toISOString().split("T")[0];
      const filtered = res.data.filter((record) => {
        const recordDate = new Date(record.markedAt).toISOString().split("T")[0];
        return recordDate === formattedDate;
      });

      setRecords(filtered);
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      alert("Something went wrong while fetching attendance.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-sm-4 text-center">
          <h5>Select Date:</h5>
          <div className='bg-success p-3 rounded'>
            <input
              type="date"
              className="form-control mt-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <button className='btn btn-light mt-3' onClick={handleShowAttendance}>
              Show Attendance
            </button>
          </div>
        </div>
      </div>

      {showResults && (
        <div className="row justify-content-center mt-5">
          <div className="col-sm-10">
            <h4 className='mb-3'>Attendance for {date}</h4>
            {records.length > 0 ? (
              records.map((rec, index) => (
                <div key={index} className="card p-3 mb-3 shadow-sm">
                  <p><strong>User Email:</strong> {rec.userEmail}</p>
                  <p><strong>Event ID:</strong> {rec.eventId}</p>
                  <p><strong>Views:</strong> {rec.views}</p>
                  <p><strong>Feedback:</strong> {rec.feedback}</p>
                  <p><strong>Suggestion:</strong> {rec.suggestion}</p>
                </div>
              ))
            ) : (
              <p className="text-muted">No attendance records found for this date.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
