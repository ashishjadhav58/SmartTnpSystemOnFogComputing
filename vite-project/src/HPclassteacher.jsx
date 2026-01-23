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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }
  
  function actionperform(e){
    // Get text content and remove emojis/extra whitespace
    const text = e.target.innerText || e.target.textContent || '';
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    
    // Also check for Profile button with emoji
    if (text.includes('Profile') || cleanText.includes('Profile') || text.includes('PROFILE')) {
      setchoice(7);
      return;
    }
    
    switch(cleanText){
      case "Data Management":
        setchoice(1)
        break;
      case "Placement Drive":
          setchoice(2)
          break;
      case "T & P Event":
          setchoice(3)
          break;
      case "T & P Resources":
      case "T & P Resouces":
          setchoice(4)
          break;
      case "Message":
          setchoice(5)
          break;
      case "Attendance":
      case "Attendace":
          setchoice(6)
          break;
      default:
        // Fallback: check if text contains keywords
        if (cleanText.includes("Data Management") || text.includes("Data Management")) {
          setchoice(1);
        } else if (cleanText.includes("Placement Drive") || text.includes("Placement Drive")) {
          setchoice(2);
        } else if (cleanText.includes("T & P Event") || text.includes("T & P Event")) {
          setchoice(3);
        } else if (cleanText.includes("T & P Resource") || text.includes("T & P Resource")) {
          setchoice(4);
        } else if (cleanText.includes("Message") || text.includes("Message")) {
          setchoice(5);
        } else if (cleanText.includes("Attendance") || text.includes("Attendance")) {
          setchoice(6);
        }
        break;
    }
  }
  return (
    <div>
      { islog === false ? <Navigate to="/" replace={true} /> : null }

      <div className="container-fluid" style={{ padding: 0, minHeight: '100vh', background: 'var(--color-bg)' }}>
        {/* Modern Header - Optimized for Mobile & Desktop */}
        <div className="modern-header" style={{ marginBottom: '2rem' }}>
          <div className="container-fluid">
            <div className="row align-items-center">
              {/* Logo and Title Section */}
              <div className="col-12 col-md-6 mb-2 mb-md-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2 gap-md-3">
                    <img 
                      src="logo.png" 
                      alt="Logo" 
                      className="d-none d-sm-block"
                      style={{ height: '50px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} 
                    />
                    <img 
                      src="logo.png" 
                      alt="Logo" 
                      className="d-block d-sm-none"
                      style={{ height: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} 
                    />
                    <div>
                      <h4 className="d-none d-sm-block" style={{ color: 'white', margin: 0, fontWeight: '600', fontSize: '1.25rem' }}>
                        Class Teacher Portal
                      </h4>
                      <h5 className="d-block d-sm-none" style={{ color: 'white', margin: 0, fontWeight: '600', fontSize: '0.95rem', lineHeight: '1.2' }}>
                        Class Teacher Portal
                      </h5>
                      <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '0.85rem' }} className="d-none d-sm-block">
                        Welcome, {user?.username || "Guest"}
                      </p>
                      <p className="d-block d-sm-none" style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '0.7rem', lineHeight: '1.2' }}>
                        {user?.username || "Guest"}
                      </p>
                    </div>
                  </div>
                  {/* Mobile Menu Button - Small, Top Right */}
                  <button 
                    className="btn btn-light d-block d-sm-none" 
                    type="button" 
                    data-bs-toggle="offcanvas" 
                    data-bs-target="#mobileNavCT" 
                    aria-controls="mobileNavCT"
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.375rem 0.625rem',
                      minWidth: 'auto',
                      fontSize: '1rem',
                      lineHeight: '1',
                      height: '36px',
                      width: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ☰
                  </button>
                </div>
              </div>
              {/* Desktop Actions - Enhanced */}
              <div className="col-12 col-md-6 d-none d-sm-flex">
                <div className="d-flex justify-content-end align-items-center gap-3 w-100">
                  <button 
                    className='btn btn-light desktop-header-btn' 
                    onClick={toggleSidebar}
                    style={{ 
                      borderRadius: '10px', 
                      fontWeight: '600', 
                      minWidth: '48px', 
                      height: '48px',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    title={sidebarOpen ? "Hide Menu" : "Show Menu"}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    {sidebarOpen ? '◀' : '▶'}
                  </button>
                  <button 
                    className='btn btn-light desktop-header-btn' 
                    onClick={(event)=>{ setchoice(7); }}
                    style={{ 
                      borderRadius: '10px', 
                      fontWeight: '600',
                      padding: '0.625rem 1.25rem',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <span>👤</span>
                    <span>Profile</span>
                  </button>
                  <button 
                    className='btn btn-light desktop-header-btn' 
                    onClick={logout}
                    style={{ 
                      borderRadius: '10px', 
                      fontWeight: '600',
                      padding: '0.625rem 1.25rem',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      background: 'rgba(255, 255, 255, 0.95)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      e.currentTarget.style.background = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                    }}
                  >
                    <span>Logout</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offcanvas nav for mobile - Enhanced */}
        <div className="offcanvas offcanvas-start" tabIndex="-1" id="mobileNavCT" aria-labelledby="mobileNavCTLabel" style={{ width: '280px' }}>
          <div className="offcanvas-header" style={{ background: 'var(--gradient-primary)', color: 'white', padding: '1.25rem' }}>
            <div className="d-flex align-items-center gap-2">
              <img src="logo.png" alt="Logo" style={{ height: '32px' }} />
              <h5 className="offcanvas-title mb-0" id="mobileNavCTLabel" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                Menu
              </h5>
            </div>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body" style={{ padding: '1rem' }}>
            {/* User Info Section */}
            <div className="mb-3 p-3" style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Logged in as</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>
                {user?.username || "Guest"}
              </p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                {user?.email || ""}
              </p>
            </div>

            <div className="d-grid gap-2">
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>📊 Data Management</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>📋 Placement Drive</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>📅 T & P Event</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>📚 T & P Resources</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>💬 Message</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>✅ Attendance</button>
              
              <hr style={{ margin: '1rem 0', borderColor: 'rgba(15, 23, 42, 0.1)' }} />
              
              <button onClick={(event)=>{ setchoice(7); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem', fontWeight: '600' }}>👤 Profile</button>
              <button onClick={()=>{ logout(); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-danger text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem', fontWeight: '600' }}>🚪 Logout</button>
            </div>
          </div>
        </div>

        <div className="container-fluid" style={{ padding: '0 1rem 2rem' }}>
          <div className="row align-items-start" style={{ margin: 0 }}>
            {/* Modern Sidebar - Toggleable */}
            {sidebarOpen && (
              <div 
                className="col-sm-3 col-lg-2 modern-sidebar d-none d-sm-block sidebar-open"
                style={{ 
                  borderRadius: '16px',
                  padding: '1.5rem 1rem',
                  transition: 'all var(--transition-base)',
                  alignSelf: 'flex-start'
                }}
              >
                <div style={{ paddingTop: '1rem' }}>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  📊 Data Management
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  📋 Placement Drive
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  📅 T & P Event
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  📚 T & P Resources
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  💬 Message
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  ✅ Attendance
                </button>
                </div>
              </div>
            )}
            
            {/* Main Content Area */}
            <div className={sidebarOpen ? 'col-sm-9 col-lg-10' : 'col-12'} style={{ transition: 'all var(--transition-base)', paddingLeft: sidebarOpen ? '1rem' : '0' }}>
              <div className="card fade-in" style={{ minHeight: '500px', padding: '2rem' }}>
                {
                  choice === 1 ? <CTdatapage/> : choice === 2 ? <Stplacementdrive/> : choice === 3 ? <StTNPEvent></StTNPEvent> : choice === 4 ? <StTNPResouces></StTNPResouces> : choice === 5 ? <Message/>  : choice ===6 ? <CTAttendence></CTAttendence> :choice === 7 ? <ProfileEdit></ProfileEdit> : ""
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
