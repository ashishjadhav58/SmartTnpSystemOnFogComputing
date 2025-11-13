import React, { useEffect, useState } from 'react'
import './style.css'
import Stddashboard from './Stddashboard'
import Message from './Message'
import Stplacementdrive from './Stplacementdrive'
import StTNPEvent from './StTNPEvent'
import { Navigate } from "react-router-dom";
import StTNPResouces from './StTNPResouces'
import CTdatapage from './CTdatapage'
import CTAttendence from './CTAttendence'
import StSelfattendence from './StSelfattendence'
import StINTERVIEWINFORMATIONGROUPS from './StINTERVIEWINFORMATIONGROUPS'
import ProfileEdit from './ProfileEdit'
export default function HPclassteacher() {
  const [user,setuser]=useState(null)
  const [islog,setislog]=useState(!!localStorage.getItem("user"))
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setuser(storedUser);
      setislog(true);
    }
  }, []);
  
  function logout(){
    localStorage.removeItem("fogIp");
    localStorage.removeItem("user");
    setislog(false);
  }
  const [choice,setchoice] = useState(1)
  function actionperform(e){
    switch(e.target.innerText){
      case "Data Management":
        setchoice(1)
        break;
      case "Placement Drive":
          setchoice(2)
          break;
      case "T & P Event":
          setchoice(3)
          break;
      case "T & P Resouces":
          setchoice(4)
          break;
      case "Message":
          setchoice(5)
          break;
      case "Attendace":
          setchoice(6)
          break;
      case "PROFILE":
          setchoice(7)
          break;
    }
    
  }
  return (
    <div>
      { islog === false ? <Navigate to="/" replace={true} /> : null }


      <div className="container-fluid bg bg-light">
        <div className="row border border-secondary">
        <div className="col-sm-1">

</div>
            <div className="col-sm-4 p-4 text-center">
                <img id="logo-login" src="logo.png" alt="" />
            </div>
            <div className="col-sm-1">

            </div>
            <div className="col-sm-5 p-4 mt-1 text-center">
                {/* Mobile navbar: visible only on xs screens */}
                <div className="row d-block d-sm-none">
                  <div className="col-12 p-2 bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <img src="logo.png" alt="logo" style={{height:32}} />
                      <button className="btn btn-outline-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileNavCT" aria-controls="mobileNavCT">
                        Menu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Offcanvas nav for mobile */}
                <div className="offcanvas offcanvas-start" tabIndex="-1" id="mobileNavCT" aria-labelledby="mobileNavCTLabel">
                  <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="mobileNavCTLabel">Menu</h5>
                    <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                  </div>
                  <div className="offcanvas-body">
                    <div className="d-grid gap-2">
                      <button onClick={(event)=>actionperform(event)} className='btn btn-light text-start'>Data Management</button>
                      <button onClick={(event)=>actionperform(event)} className='btn btn-light text-start'>Placement Drive</button>
                      <button onClick={(event)=>actionperform(event)} className='btn btn-light text-start'>T & P Event</button>
                      <button onClick={(event)=>actionperform(event)} className='btn btn-light text-start'>T & P Resouces</button>
                      <button onClick={(event)=>actionperform(event)} className='btn btn-light text-start'>Message</button>
                      <button onClick={(event)=>actionperform(event)} className='btn btn-light text-start'>Attendace</button>
                    </div>
                  </div>
                </div>

                <div className="row">
                    <div className="col-sm-4 ">
                    <button className='border border-light  btn btn-light p-1 bg bg-light '><b>Welcome  {user?.username || "Guest"} <br /> Class Teacher ID : {user?.email || "Guest"}</b></button>
                    </div>
                    <div className="col-sm-4">
                        <button className='border border-light  btn btn-secondary' onClick={(event)=>actionperform(event)}><b>PROFILE </b></button>
                    </div>
                    <div className="col-sm-4">
                        <button className='border border-light  btn btn-secondary' onClick={logout}><b>LOGOUT &#10238;</b></button>
                    </div>
                </div>
            </div>
            <div className="col-sm-2">

            </div>
        </div>
    <div className="row">
      <div className="col-sm-2 border border-secondary  text-start d-none d-sm-block">
      <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start' >Data Management</button>
      <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start' >Placement Drive</button>
      <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start' >T & P Event </button>
      <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start' >T & P Resouces</button>
      <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start' >Message</button>
      <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start mb-5 pb-5' >Attendace</button>
      </div>
            <div className="col-sm-9">
                {
                  choice === 1 ? <CTdatapage/> : choice === 2 ? <Stplacementdrive/> : choice === 3 ? <StTNPEvent></StTNPEvent> : choice === 4 ? <StTNPResouces></StTNPResouces> : choice === 5 ? <Message/>  : choice ===6 ? <CTAttendence></CTAttendence> :choice === 7 ? <ProfileEdit></ProfileEdit> : ""
                }
            </div>
        </div>
      </div>
    </div>
  )
}
