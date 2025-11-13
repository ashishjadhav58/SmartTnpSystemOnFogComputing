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
  const closeMobileNav = () => {
    try {
      const el = document.querySelector('.offcanvas.show');
      if (el && window.bootstrap) {
        const bs = window.bootstrap.Offcanvas.getInstance(el) || new window.bootstrap.Offcanvas(el);
        bs.hide();
      }
    } catch (e) {}
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
                {/* Mobile navbar: visible only on xs screens */}
                <div className="row d-block d-sm-none">
                  <div className="col-12 p-2 bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <img src="logo.png" alt="logo" style={{height:32}} />
                      <button className="btn btn-outline-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileNavTpo" aria-controls="mobileNavTpo">
                        Menu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Offcanvas nav for mobile */}
                <div className="offcanvas offcanvas-start" tabIndex="-1" id="mobileNavTpo" aria-labelledby="mobileNavTpoLabel">
                  <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="mobileNavTpoLabel">Menu</h5>
                    <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                  </div>
                  <div className="offcanvas-body">
                    <div className="d-grid gap-2">
                      <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start'>Data Management</button>
                      <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start'>T & P Event</button>
                      <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start'>T & P Resouces</button>
                      <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start'>Upcoming Drives</button>
                      <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start'>Messages</button>
                      <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start'>PROFILE</button>
                      <button onClick={()=>{ logout(); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-danger text-start'>LOGOUT</button>
                    </div>
                  </div>
                </div>

                <div className="row">
                    <div className="col-sm-6 border border-grey ">
                    <button className='border border-light  btn btn-light p-1 bg bg-light '><b>Welcome  {user?.username || "Guest"} <br /> TPO ID : {user?.email || "Guest"}</b></button>
                    </div>
          <div className="col-sm-3 d-none d-sm-block">
            <button className='border border-light  btn btn-secondary d-none d-sm-inline-block' onClick={(event)=>actionperform(event)}><b>PROFILE </b></button>
          </div>
          <div className="col-sm-3 d-none d-sm-block">
            <button className='border border-light  btn btn-secondary d-none d-sm-inline-block' onClick={logout}><b>LOGOUT &#10238;</b></button>
          </div>
                </div>
            </div>
        </div>
    <div className="row">
      <div className="col-sm-2 border border-secondary  text-start d-none d-sm-block">
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
