import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function CTdatapage() {
  const backendUrl = useSelector((state) => state.backend.backendUrl);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [view, setView] = useState("list"); 
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.post(`${backendUrl}/api/classteacher/getdata/students/${user.email}`);
        setStudents(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchStudents();
  }, [user.email]);

  const handleViewProfile = async (email) => {
    try {
      const res = await axios.post(`${backendUrl}/api/classteacher/getdata/student/profile/${email}`);
      setSelectedStudent(res.data[0]);
      setView("profile");
    } catch (err) {
      console.log(err);
    }
  };

  const handleMessage = (studentEmail) => {
    navigate("/message", {
      state: {
        end1: user.email,
        end2: studentEmail
      }
    });
  };

  const goBack = () => {
    setView("list");
  };

  return (
    <div>
      <div className="row mt-3 ms-2">
        <div className="col-sm-6 text-start">
          <button 
            className='text text-secondary bg bg-light border border-light' 
            onClick={() => {
              if (view === "profile") goBack();
            }}
          >
            <b>Class Teacher →</b>
          </button>
          {view === "profile" && (
            <button className='bg bg-light border border-light text text-secondary' onClick={goBack}>
              <b>Student →</b>
            </button>
          )}
        </div>
      </div>

      {view === "list" ? (
        <>
          <div className="row justify-content-center bg bg-primary text-light border border-grey p-1 mb-2 mt-2 ms-1">
            <div className="col-sm-2 text-center">Student Name</div>
            <div className="col-sm-2 text-center">Email-ID</div>
            <div className="col-sm-2 text-center"></div>
            <div className="col-sm-2 text-center"></div>
          </div>
          {students.length > 0 ? (
            students.map((student) => (
              <div key={student._id} className="row justify-content-center border border-grey p-1 mb-2 mt-2 ms-1">
                <div className="col-sm-2 text-center p-1">{student.username}</div>
                <div className="col-sm-2 text-center p-1">{student.email}</div>
                <div className="col-sm-2 text-center">
                  <button className='btn btn-light border border-grey p-1' onClick={() => handleMessage(student.email)}>MESSAGE</button>
                </div>
                <div className="col-sm-2 text-center">
                  <button className='btn btn-light border border-grey p-1' onClick={() => handleViewProfile(student.email)}>PROFILE</button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">No students found.</p>
          )}
        </>
      ) : (
        <>
          <div className='row justify-content-center mt-4 p-4'>
            <div className="col-sm-8 border border-grey">
              <h4 className='text-center mt-3 mb-3'>{selectedStudent?.username}</h4>
              <p className='text-center'>Email : {selectedStudent?.email}</p>
              <p className='text-center'>TPO Email : {selectedStudent?.tpoemail}</p>
              <p className='text-center'>Class Teacher Email : {selectedStudent?.classemail}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
