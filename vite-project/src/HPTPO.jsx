import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import CreateRecruiter from './tpopages/CreateRecruiter'
import ManageRecruiters from './tpopages/ManageRecruiters'
import ApproveDrives from './tpopages/ApproveDrives'
import { getCurrentUser, isAuthenticated, hasAccessType } from './utils/auth'

export default function HPTPO() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const navigate = useNavigate();
  const [user, setuser] = useState(null);
  const [islog, setislog] = useState(false);
  const [choice, setchoice] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }

    // Check if user is TPO
    if (!hasAccessType('Training and placement officer')) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        switch (currentUser.accesstype) {
          case 'Student':
            navigate('/student', { replace: true });
            break;
          case 'Class Teacher':
            navigate('/classteacher', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
      return;
    }

    const storedUser = getCurrentUser();
    if (storedUser) {
      setuser(storedUser);
      setislog(true);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);
  
  // If not authenticated, redirect immediately
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // If not TPO, redirect to appropriate page
  if (!hasAccessType('Training and placement officer')) {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.accesstype) {
      switch (currentUser.accesstype) {
        case 'Student':
          return <Navigate to="/student" replace />;
        case 'Class Teacher':
          return <Navigate to="/classteacher" replace />;
        default:
          localStorage.removeItem('user');
          localStorage.removeItem('fogIp');
          return <Navigate to="/" replace />;
      }
    }
    return <Navigate to="/" replace />;
  }
  
  // Show loading state if authenticated but user data not loaded yet
  if (!islog || !user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: '10px' }}>Loading TPO portal...</p>
      </div>
    );
  }
  
  function logout(){
    // Clear all session data
    localStorage.removeItem("fogIp");
    localStorage.removeItem("user");
    localStorage.removeItem("recruiter");
    localStorage.removeItem("rememberedEmail");
    setislog(false);
    // Redirect to login
    window.location.href = '/';
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
      case "Dashboard":
        setchoice(1)
        break;
      case "Data Management":
          setchoice(2)
          break;
      case "T & P Event":
          setchoice(3)
          break;
      case "T & P Resources":
      case "T & P Resouces":
          setchoice(4)
          break;
      case "Messages":
          setchoice(5)
          break;
      case "Upcoming Drives":
          setchoice(6)
          break;
      case "Create Recruiter":
      case "Recruiter":
          setchoice(8)
          break;
      case "Manage Recruiters":
      case "Recruiters":
          setchoice(9)
          break;
      case "Approve Drives":
      case "Drive Approval":
          setchoice(10)
          break;
      default:
        // Fallback: check if text contains keywords
        if (cleanText.includes("Data Management") || text.includes("Data Management")) {
          setchoice(2);
        } else if (cleanText.includes("T & P Event") || text.includes("T & P Event")) {
          setchoice(3);
        } else if (cleanText.includes("T & P Resource") || text.includes("T & P Resource")) {
          setchoice(4);
        } else if (cleanText.includes("Messages") || text.includes("Messages")) {
          setchoice(5);
        } else if (cleanText.includes("Upcoming Drives") || text.includes("Upcoming Drives")) {
          setchoice(6);
        } else if (cleanText.includes("Create Recruiter") || text.includes("Recruiter") && !cleanText.includes("Manage")) {
          setchoice(8);
        } else if (cleanText.includes("Manage Recruiters") || (cleanText.includes("Recruiters") && cleanText.includes("Manage"))) {
          setchoice(9);
        } else if (cleanText.includes("Approve Drives") || cleanText.includes("Drive Approval")) {
          setchoice(10);
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
                        Training and Placement Office
                      </h4>
                      <h5 className="d-block d-sm-none" style={{ color: 'white', margin: 0, fontWeight: '600', fontSize: '0.95rem', lineHeight: '1.2' }}>
                        TPO Portal
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
                    data-bs-target="#mobileNavTpo" 
                    aria-controls="mobileNavTpo"
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
        <div className="offcanvas offcanvas-start" tabIndex="-1" id="mobileNavTpo" aria-labelledby="mobileNavTpoLabel" style={{ width: '280px' }}>
          <div className="offcanvas-header" style={{ background: 'var(--gradient-primary)', color: 'white', padding: '1.25rem' }}>
            <div className="d-flex align-items-center gap-2">
              <img src="logo.png" alt="Logo" style={{ height: '32px' }} />
              <h5 className="offcanvas-title mb-0" id="mobileNavTpoLabel" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
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
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>📅 T & P Event</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>📚 T & P Resources</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>🚀 Upcoming Drives</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>💬 Messages</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>👥 Create Recruiter</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>👥 Manage Recruiters</button>
              <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>✅ Approve Drives</button>
              
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
                  🚀 Upcoming Drives
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  💬 Messages
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  👥 Create Recruiter
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  👥 Manage Recruiters
                </button>
                <button 
                  id="dashboard-option" 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  ✅ Approve Drives
                </button>
                </div>
              </div>
            )}
            
            {/* Main Content Area */}
            <div className={sidebarOpen ? 'col-sm-9 col-lg-10' : 'col-12'} style={{ transition: 'all var(--transition-base)', paddingLeft: sidebarOpen ? '1rem' : '0' }}>
              <div className="card fade-in" style={{ minHeight: '500px', padding: '2rem' }}>
                {
                  choice === 1 ? <Datamanagement/> : 
                  choice === 2 ? <Datamanagement/> : 
                  choice === 3 ? <TpoEvent/> : 
                  choice === 4 ? <Tpresouce/> : 
                  choice === 5 ? <Message/> : 
                  choice === 6 ? <PlacementSet/> :
                  choice === 7 ? <ProfileEdit/> : 
                  choice === 8 ? <CreateRecruiter/> :
                  choice === 9 ? <ManageRecruiters/> :
                  choice === 10 ? <ApproveDrives/> :
                  <Datamanagement/>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
