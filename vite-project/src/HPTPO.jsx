import React, { useEffect, useState } from 'react'
import './style.css'
import Stddashboard from './Stddashboard'
import Message from './Message'
import Stplacementdrive from './Stplacementdrive'
import StTNPEvent from './StTNPEvent'
import TpoEvent from './TpoEvent'
import { Navigate } from "react-router-dom";
import Tpresouce from './Tpresouce'
import TpoDashboard from './TpoDashboard'
import StTNPResouces from './StTNPResouces'
import PlacementSet from './PlacementSet'
import StSelfattendence from './StSelfattendence'
import Datamanagement from './tpopages/Datamanagement'
import StINTERVIEWINFORMATIONGROUPS from './StINTERVIEWINFORMATIONGROUPS'
import ProfileEdit from './ProfileEdit'
export default function HPTPO() {
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
      case "Dashboard":
        setchoice(1)
        break;
      case "Data Management":
          setchoice(2)
          break;
      case "T & P Event":
          setchoice(3)
          break;
      case "T & P Resouces":
          setchoice(4)
          break;
      case "Messages":
          setchoice(5)
          break;
      case "Upcoming Drives":
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
            <div className="col-sm-3  pt-4 text-center">
                <img id="logo-login" src="logo.png" alt="" />
            </div>
            <div className="col-sm-4 mt-4">
    <h3 className='text text-danger text-center'>Traning and Placement Office</h3>
            </div>
            <div className="col-sm-5 p-4 mt-1 text-center">
                <div className="row">
                    <div className="col-sm-6 border border-grey ">
                    <button className='border border-light  btn btn-light p-1 bg bg-light '><b>Welcome  {user?.username || "Guest"} <br /> TPO ID : {user?.email || "Guest"}</b></button>
                    </div>
                    <div className="col-sm-3">
                        <button className='border border-light  btn btn-secondary' onClick={(event)=>actionperform(event)}><b>PROFILE </b></button>
                    </div>
                    <div className="col-sm-3">
                        <button className='border border-light  btn btn-secondary' onClick={logout}><b>LOGOUT &#10238;</b></button>
                    </div>
                </div>
            </div>
        </div>
        <div className="row">
            <div className="col-sm-2 border border-secondary  text-start">
            <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start' >Data Management</button>
            <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start' >T & P Event </button>
            <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start' >T & P Resouces</button>
            <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start  ' >Upcoming Drives</button> 
            <button id="dashboard-option" onClick={(event)=>actionperform(event)} className='btn btn-light mt-5 text-start mb-5 pb-5' >Messages</button>
            </div>
            <div className="col-sm-9">
                {
                  choice === 2 || choice === 1 ? <Datamanagement/> : choice === 3 ? <TpoEvent></TpoEvent> : choice === 4 ? <Tpresouce></Tpresouce> : choice === 5 ? <Message></Message> : choice ===6 ? <PlacementSet></PlacementSet> :choice === 7 ? <ProfileEdit></ProfileEdit> : ""
                }
            </div>
        </div>
      </div>
    </div>
  )
}
