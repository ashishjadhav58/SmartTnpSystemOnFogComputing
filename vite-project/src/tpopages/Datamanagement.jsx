import React, { useEffect, useState } from 'react'
import '../style.css'
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
export default function Datamanagement() {
  const [data,setdata]=useState([])
  const navigate = useNavigate();
  const [data1,setdata1]=useState([])
  const [data2,setdata2]=useState([])
  const [end1,setend1]=useState("");
  const backendUrl = useSelector((state) => state.backend.backendUrl);
  const [end2,setend2]=useState("");
  const [tap,settp]=useState(0)
  const user = JSON.parse(localStorage.getItem("user"));
  const openstud = async (e)=> {
    try {
      settp(1)
      const res = await axios.post(`${backendUrl}/api/tpo/getdata/studentt/${e}`);
      setdata1(Array.isArray(res.data) ? res.data : []);
    } catch(err) {
      console.log(err);
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
        const response = await axios.post(`${backendUrl}/api/tpo/getdataa/${mail.email}`);
        setdata(Array.isArray(response.data) ? response.data : []);
      }
      catch(error){
        console.log("404 error");
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
  return (
    <div>
      <div className="row mt-3 ms-2">
        <div className="col-sm-6 text-start">
          <button className='text text-secondary bg  bg-light border border-light '><b>tpo &#8594;</b></button><button className='bg bg-light border border-light text text-secondary' onClick={gotoclass}><b>classteacher &#8594;</b></button>{tap === 1 ? <><button className='bg bg-light border border-light text text-secondary' onClick={gotoStudent}><b>student &#8594;</b></button></>:tap === 2 ? <><button onClick={gotoStudent} className='bg bg-light border border-light text text-secondary'><b>student &#8594;</b></button><button className='bg bg-light border border-light text text-secondary'><b>profile &#8594;</b></button></>:""}
        </div>
      </div>
      {
        tap === 0 ? <><div className="row justify-content-center bg bg-primary text text-light border border-grey p-1 mb-2 mt-2 ms-1"><div className="col-sm-2 text-center">Class Teacher Name</div> <div className="col-sm-2 text-center">Email-ID</div> <div className="col-sm-2 text-center"></div> <div className="col-sm-2 text-center"></div></div>
        {
          data.length > 0?
          <>
            <div>
            {
              data.map((e)=>{
                return <><div id={e._id} className="row justify-content-center border border-grey p-1 mb-2 mt-2 ms-1"><div className="col-sm-2 text-center p-1">{e.username}</div> <div className="col-sm-2 text-center p-1">{e.email}</div> <div className="col-sm-2 text-center"><button className='btn btn-light border border-grey p-1' id={e.email} onClick={MessageTab}>MESSAGE</button></div> <div className="col-sm-2 text-center "><button className='btn btn-light border border-grey p-1' onClick={() => openstud(e.email)}>OPEN</button></div></div></>
})
            }
            </div>
          </> :
          <>NODATA</>
        }</>:tap === 1 ? 
          <><div className="row justify-content-center bg bg-primary text text-light border border-grey p-1 mb-2 mt-2 ms-1"><div className="col-sm-2 text-center">Student Name</div> <div className="col-sm-2 text-center">Email-ID</div> <div className="col-sm-2 text-center"></div> <div className="col-sm-2 text-center"></div></div>
          {
            tap === 1 ? <>
            {
              data1.map((e)=>{
                return <><div id={e._id} className="row justify-content-center border border-grey p-1 mb-2 mt-2 ms-1"><div className="col-sm-2 text-center p-1">{e.username}</div> <div className="col-sm-2 text-center p-1">{e.email}</div> <div className="col-sm-2 text-center"><button className='btn btn-light border border-grey p-1' id={e.email} onClick={MessageTab}>MESSAGE</button></div> <div className="col-sm-2 text-center "><button className='btn btn-light border border-grey p-1' onClick={()=>gotoprofile(e.email)}>PROFILE</button></div></div></>
})
            }
            </>:""
          }
          </>
        :tap === 2 ? <>
          <div className='row justify-content-center mt-4 p-4'>
            <div className="col-sm-8 border border-grey">
                <h4 className='text-center text-grey mt-3 mb-3'>{data2[0].username}</h4>
                <p className='text-center'>Email : {data2[0].email}</p>
                <p className='text-center'>Tpo email : {data2[0].tpoemail}</p>
                <p className='text-center'>Class Teacher Email : {data2[0].classemail}</p>
            </div>
          </div>
        </> :<>No Data</>
      }
    </div>
  )
}
