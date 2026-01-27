import React, { useEffect, useState } from 'react'
import '../style.css'
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ImportStudentData from './ImportStudentData';
// axios is loaded via CDN in index.html

export default function Datamanagement() {
  const [data,setdata]=useState([])
  const navigate = useNavigate();
  const [data1,setdata1]=useState([])
  const [data2,setdata2]=useState([])
  const [end1,setend1]=useState("");
  const backendUrl = useSelector((state) => state.backend.backendUrl);
  const [end2,setend2]=useState("");
  const [tap,settp]=useState(0)
  const [showImportModal, setShowImportModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const openstud = async (e)=> {
    try {
      settp(1)
      // Use AWS Lambda endpoint to fetch students
      const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
      const user = JSON.parse(localStorage.getItem("user"));
      try {
        const res = await axios.get(`${awsApiUrl}/users`, {
          params: {
            role: "student", // AWS expects lowercase "student"
            tpoemail: user?.email || "",
            classemail: e
          }
        });
        // AWS returns DynamoDB items, normalize to match expected format
        const students = Array.isArray(res.data) ? res.data.map(item => ({
          _id: item.id || item.email,
          username: item.username,
          email: item.email,
          accesstype: item.accesstype || "Student",
          tpoemail: item.tpoemail,
          classemail: item.classemail
        })) : [];
        setdata1(students);
        return;
      } catch(awsErr) {
        console.log("AWS fetch failed, trying local backend:", awsErr);
      }
      // Fallback to local backend if AWS fails
      const res = await axios.post(`${backendUrl}/api/tpo/getdata/studentt/${e}`);
      setdata1(Array.isArray(res.data) ? res.data : []);
    } catch(err) {
      console.log("Error fetching students:", err);
      setdata1([]);
    }
  }
  function gotoclass(){
    settp(0)
  }
  const gotoprofile = async (e)=>{
    try {
      const res = await axios.post(`${backendUrl}/api/tpo/getdata/student/profilee/${e}`);
      setdata2(Array.isArray(res.data) ? res.data : []);
      settp(2)
    } catch(err) {
      console.log(err);
    }
  }
  function gotoStudent(){
    settp(1)
  }
  useEffect(()=>{
    const getdata = async ()=>{
      try{
        const mail = JSON.parse(localStorage.getItem("user"));
        const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
        
        // Try AWS Lambda GET /users/class-teachers endpoint first
        try {
          const response = await axios.get(`${awsApiUrl}/users/class-teachers`, {
            params: {
              tpoemail: mail.email
            }
          });
          
          console.log("AWS Class Teachers Response:", response.data);
          
          // AWS returns DynamoDB items, normalize to match expected format
          const classTeachers = Array.isArray(response.data) ? response.data : [];
          
          console.log("Class Teachers Array:", classTeachers);
          
          // Normalize data format
          const normalized = classTeachers.map(item => ({
            _id: item.id || item.email,
            username: item.username,
            email: item.email,
            accesstype: item.accesstype || "Class Teacher",
            tpoemail: item.tpoemail || mail.email,
            classemail: item.classemail || ""
          }));
          
          console.log("Normalized Class Teachers:", normalized);
          setdata(normalized);
          return;
        } catch(awsErr) {
          console.log("AWS fetch failed, trying local backend:", awsErr);
        }
        
        // Fallback to local backend
        const response = await axios.post(`${backendUrl}/api/tpo/getdataa/${mail.email}`);
        const classTeachers = Array.isArray(response.data) ? response.data : [];
        
        // Normalize data format
        const normalized = classTeachers.map(item => ({
          _id: item._id || item.id || item.email,
          username: item.username,
          email: item.email,
          accesstype: item.accesstype || "Class Teacher",
          tpoemail: item.tpoemail || mail.email,
          classemail: item.classemail || ""
        }));
        
        setdata(normalized);
      }
      catch(error){
        console.log("404 error:", error);
        setdata([]);
      }
    }
    getdata()
  },[])
  function MessageTab(Event){
    const end1 = user.email;
    const end2 = Event.target.id;
    setend1(end1);
    setend2(end2);
    navigate("/message", { state: { end1: end1, end2: end2} });
  }
  const handleImportSuccess = () => {
    // Refresh class teachers list using AWS Lambda endpoint
    const getdata = async () => {
      try {
        const mail = JSON.parse(localStorage.getItem("user"));
        const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
        
        // Try AWS Lambda GET /users/class-teachers endpoint first
        try {
          const response = await axios.get(`${awsApiUrl}/users/class-teachers`, {
            params: {
              tpoemail: mail.email
            }
          });
          
          console.log("AWS Class Teachers Response:", response.data);
          
          // AWS returns DynamoDB items, normalize to match expected format
          const classTeachers = Array.isArray(response.data) ? response.data : [];
          
          console.log("Class Teachers Array:", classTeachers);
          
          // Normalize data format
          const normalized = classTeachers.map(item => ({
            _id: item.id || item.email,
            username: item.username,
            email: item.email,
            accesstype: item.accesstype || "Class Teacher",
            tpoemail: item.tpoemail || mail.email,
            classemail: item.classemail || ""
          }));
          
          console.log("Normalized Class Teachers:", normalized);
          setdata(normalized);
          return;
        } catch(awsErr) {
          console.log("AWS fetch failed, trying local backend:", awsErr);
        }
        
        // Fallback to local backend
        const response = await axios.post(`${backendUrl}/api/tpo/getdataa/${mail.email}`);
        const classTeachers = Array.isArray(response.data) ? response.data : [];
        
        // Normalize data format
        const normalized = classTeachers.map(item => ({
          _id: item._id || item.id || item.email,
          username: item.username,
          email: item.email,
          accesstype: item.accesstype || "Class Teacher",
          tpoemail: item.tpoemail || mail.email,
          classemail: item.classemail || ""
        }));
        
        setdata(normalized);
      } catch (error) {
        console.log("404 error:", error);
        setdata([]);
      }
    };
    getdata();
    setShowImportModal(false);
  };

  return (
    <div>
      {showImportModal && (
        <ImportStudentData 
          onClose={() => setShowImportModal(false)} 
          onSuccess={handleImportSuccess}
        />
      )}
      <div className="row mt-3 ms-2">
        <div className="col-sm-6 text-start">
          <button className='text text-secondary bg  bg-light border border-light '><b>tpo &#8594;</b></button><button className='bg bg-light border border-light text text-secondary' onClick={gotoclass}><b>classteacher &#8594;</b></button>{tap === 1 ? <><button className='bg bg-light border border-light text text-secondary' onClick={gotoStudent}><b>student &#8594;</b></button></>:tap === 2 ? <><button onClick={gotoStudent} className='bg bg-light border border-light text text-secondary'><b>student &#8594;</b></button><button className='bg bg-light border border-light text text-secondary'><b>profile &#8594;</b></button></>:""}
        </div>
        <div className="col-sm-6 text-end">
          <button 
            className='btn btn-primary' 
            onClick={() => setShowImportModal(true)}
            style={{ borderRadius: '8px', fontWeight: '600' }}
          >
            📥 Import StudentData
          </button>
        </div>
      </div>
      {
        tap === 0 ? (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-primary">
                <tr>
                  <th className="text-center">Class Teacher Name</th>
                  <th className="text-center">Email-ID</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((e) => (
                    <tr key={e._id || e.email} id={e._id}>
                      <td className="text-center">{e.username || 'N/A'}</td>
                      <td className="text-center">{e.email || 'N/A'}</td>
                      <td className="text-center">
                        <button 
                          className='btn btn-sm btn-outline-primary me-2' 
                          id={e.email} 
                          onClick={MessageTab}
                        >
                          MESSAGE
                        </button>
                        <button 
                          className='btn btn-sm btn-outline-success' 
                          onClick={() => openstud(e.email)}
                        >
                          OPEN
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">No Class Teachers Found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : tap === 1 ? (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-primary">
                <tr>
                  <th className="text-center">Student Name</th>
                  <th className="text-center">Email-ID</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data1.length > 0 ? (
                  data1.map((e) => (
                    <tr key={e._id || e.email} id={e._id}>
                      <td className="text-center">{e.username || 'N/A'}</td>
                      <td className="text-center">{e.email || 'N/A'}</td>
                      <td className="text-center">
                        <button 
                          className='btn btn-sm btn-outline-primary me-2' 
                          id={e.email} 
                          onClick={MessageTab}
                        >
                          MESSAGE
                        </button>
                        <button 
                          className='btn btn-sm btn-outline-info' 
                          onClick={() => gotoprofile(e.email)}
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
        ) : tap === 2 ? (
          <div className='row justify-content-center mt-4 p-4'>
            <div className="col-sm-8 border border-grey">
              {data2.length > 0 && data2[0] ? (
                <>
                  <h4 className='text-center text-grey mt-3 mb-3'>{data2[0].username}</h4>
                  <p className='text-center'>Email : {data2[0].email}</p>
                  <p className='text-center'>Tpo email : {data2[0].tpoemail}</p>
                  <p className='text-center'>Class Teacher Email : {data2[0].classemail}</p>
                </>
              ) : (
                <p className='text-center'>No profile data available</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <p>No Data</p>
          </div>
        )
      }
    </div>
  )
}
