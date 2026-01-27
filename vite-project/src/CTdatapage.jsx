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
        const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
        
        // Try AWS Lambda GET /users endpoint first
        try {
          const res = await axios.get(`${awsApiUrl}/users`, {
            params: {
              role: "student", // AWS expects lowercase "student"
              classemail: user.email // Filter by class teacher email
            }
          });
          
          // AWS returns DynamoDB items, normalize to match expected format
          const studentsData = Array.isArray(res.data) ? res.data.map(item => ({
            _id: item.id || item.email,
            username: item.username,
            email: item.email,
            accesstype: item.accesstype || "Student",
            tpoemail: item.tpoemail,
            classemail: item.classemail
          })) : [];
          
          setStudents(studentsData);
          return;
        } catch(awsErr) {
          console.log("AWS fetch failed, trying local backend:", awsErr);
        }
        
        // Fallback to local backend if AWS fails
        const res = await axios.post(`${backendUrl}/api/classteacher/getdata/students/${user.email}`);
        setStudents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log("Error fetching students:", err);
        setStudents([]);
      }
    };

    if (user && user.email) {
      fetchStudents();
    }
  }, [user?.email, backendUrl]);

  const handleViewProfile = async (email) => {
    try {
      const res = await axios.post(`${backendUrl}/api/classteacher/getdata/student/profile/${email}`);
      // Handle both array and single object responses
      const studentData = Array.isArray(res.data) ? res.data[0] : res.data;
      setSelectedStudent(studentData);
      setView("profile");
    } catch (err) {
      console.log("Error fetching student profile:", err);
      setSelectedStudent(null);
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
        <div className="table-responsive mt-3">
          <table className="table table-striped table-hover table-bordered">
            <thead className="table-primary">
              <tr>
                <th className="text-center">Student Name</th>
                <th className="text-center">Email-ID</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id || student.email}>
                    <td className="text-center">{student.username || 'N/A'}</td>
                    <td className="text-center">{student.email || 'N/A'}</td>
                    <td className="text-center">
                      <button 
                        className='btn btn-sm btn-outline-primary me-2' 
                        onClick={() => handleMessage(student.email)}
                      >
                        MESSAGE
                      </button>
                      <button 
                        className='btn btn-sm btn-outline-info' 
                        onClick={() => handleViewProfile(student.email)}
                      >
                        PROFILE
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">No Students Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className='row justify-content-center mt-4 p-4'>
            <div className="col-sm-8 border border-grey">
              {selectedStudent ? (
                <>
                  <h4 className='text-center mt-3 mb-3'>{selectedStudent.username}</h4>
                  <p className='text-center'>Email : {selectedStudent.email}</p>
                  <p className='text-center'>TPO Email : {selectedStudent.tpoemail}</p>
                  <p className='text-center'>Class Teacher Email : {selectedStudent.classemail}</p>
                </>
              ) : (
                <p className='text-center'>No profile data available</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
