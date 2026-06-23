import React, { useState, useEffect } from 'react';
import './style.css';
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setBackendUrl } from "./store/backendSlice";
import { isAuthenticated, getCurrentUser, isRecruiterAuthenticated, getCurrentRecruiter } from './utils/auth';
import { tryAWSWithLocalFallback, isVercelDomain, isIPAddress, getCurrentHostIP, getAIServiceUrl, getBackendUrl } from './utils/networkUtils';


export default function Loginpage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logcode, setlogcode] = useState(0);
  
  // Redirect if already logged in (only if user data is valid)
  useEffect(() => {
    const user = getCurrentUser();
    // Only redirect if we have valid user data with required fields
    if (user && user.email && user.accesstype && isAuthenticated()) {
      switch (user.accesstype) {
        case "Student":
          navigate('/student', { replace: true });
          break;
        case "Class Teacher":
          navigate('/classteacher', { replace: true });
          break;
        case "Training and placement officer":
          navigate('/tpo', { replace: true });
          break;
        case "Recruiter":
          // Recruiters should be redirected to recruiter dashboard
          // Format user as recruiter and save to recruiter session
          const recruiterData = {
            _id: user._id || user.id || user.email,
            email: user.email,
            username: user.username || user.email,
            companyName: user.companyName || '',
            contactNumber: user.contactNumber || '',
            accesstype: "Recruiter",
            isApproved: user.isApproved !== false,
            createdBy: user.createdBy || user.tpoemail || '',
            approvedBy: user.approvedBy || ''
          };
          localStorage.setItem("recruiter", JSON.stringify(recruiterData));
          localStorage.removeItem("user"); // Clear regular user session
          navigate('/recruiter/dashboard', { replace: true });
          break;
        default:
          // Invalid access type, clear session
          localStorage.removeItem('user');
          localStorage.removeItem('fogIp');
      }
    } else if (user && (!user.email || !user.accesstype)) {
      // Invalid user data, clear it
      localStorage.removeItem('user');
      localStorage.removeItem('fogIp');
    }
    
    // Also check if recruiter is logged in and redirect
    if (isRecruiterAuthenticated()) {
      navigate('/recruiter/dashboard', { replace: true });
    }
  }, [navigate]);
  const [data, setdata] = useState({
    username: '',
    password: ''
  });
  const [Tosignup, setsp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load remembered email if exists
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setdata(prev => ({ ...prev, username: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const islogin = (event) => {
    const { name, value } = event.target;
    setdata(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear general error
    if (error) setError('');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!data.username.trim()) {
      errors.username = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.username)) {
      errors.username = 'Please enter a valid email address';
    }
    
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkdata = async (event) => {
    event.preventDefault();
    setError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
      
      let response;
      let user;
      let fogIp;
      let aiServices = {};
      
      // If Vercel domain, only use AWS
      if (isVercelDomain()) {
        console.log('[Login] Vercel domain - using AWS only');
        response = await axios.post(
          `${awsApiUrl}/signin`,
          {
            username: data.username,
            password: data.password
          },
          { timeout: 10000 }
        );
        user = response.data?.data;
        fogIp = response.data.ip;
        // Use AI service URLs from AWS response (when online)
        aiServices = response.data?.aiServices || {};
        console.log('[Login] AI Services from AWS (Vercel):', aiServices);
      } 
      // If IP address, try AWS first, then fallback to local
      else if (isIPAddress()) {
        const currentIP = getCurrentHostIP();
        const localBackendUrl = getBackendUrl();
        const localAIServiceUrl = getAIServiceUrl();
        
        console.log('[Login] IP address detected - trying AWS first, then local fallback');
        
        try {
          // Try AWS first with timeout
          response = await Promise.race([
            axios.post(
              `${awsApiUrl}/signin`,
              {
                username: data.username,
                password: data.password
              },
              { timeout: 5000 }
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AWS timeout')), 5000)
            )
          ]);
          
          console.log('[Login] AWS signin successful');
          user = response.data?.data;
          fogIp = response.data.ip;
          // Use AI service URLs from AWS response (when online)
          aiServices = response.data?.aiServices || {};
          console.log('[Login] AI Services from AWS:', aiServices);
        } catch (awsError) {
          console.warn('[Login] AWS signin failed, trying local server:', awsError.message);
          
          // AWS failed, try local fog server
          try {
            response = await axios.post(
              `${localBackendUrl}/api/user/signin`,
              {
                username: data.username,
                password: data.password
              },
              { timeout: 10000 }
            );
            
            console.log('[Login] Local signin successful');
            user = response.data?.data || response.data?.user;
            fogIp = response.data?.ip || localBackendUrl;
            aiServices = response.data?.aiServices || {
              baseUrl: localAIServiceUrl,
              resume: `${localAIServiceUrl}/resume`,
              predict: `${localAIServiceUrl}/predict`,
              match: `${localAIServiceUrl}/match`,
              chat: `${localAIServiceUrl}/resume/chat`
            };
          } catch (localError) {
            console.error('[Login] Local signin also failed:', localError);
            throw new Error('Both AWS and local server are unavailable. Please check your network connection.');
          }
        }
      }
      // Default: use AWS only
      else {
        console.log('[Login] Using AWS (default)');
        response = await axios.post(
          `${awsApiUrl}/signin`,
          {
            username: data.username,
            password: data.password
          },
          { timeout: 10000 }
        );
        user = response.data?.data;
        fogIp = response.data.ip;
        // Use AI service URLs from AWS response (when online)
        aiServices = response.data?.aiServices || {};
        console.log('[Login] AI Services from AWS (default):', aiServices);
      }
      
      if (user) {
        // Remember email if checkbox is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', data.username);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        dispatch(setBackendUrl(fogIp));
        localStorage.setItem("fogIp", fogIp);
        
        // Store AI service URLs from signin response
        // When online (AWS): Use AI service URLs from AWS response
        // When offline (local): Use local IP:8000 (already set in local fallback)
        if (aiServices && Object.keys(aiServices).length > 0) {
          localStorage.setItem("aiServices", JSON.stringify(aiServices));
          console.log('[Login] ✅ Stored AI services from response (online mode):', aiServices);
        } else {
          // Fallback: If no AI services in response, determine based on network mode
          const fallbackAiServices = isIPAddress() ? {
            baseUrl: getAIServiceUrl(),
            resume: `${getAIServiceUrl()}/resume`,
            predict: `${getAIServiceUrl()}/predict`,
            match: `${getAIServiceUrl()}/match`,
            chat: `${getAIServiceUrl()}/resume/chat`
          } : {
            baseUrl: 'http://localhost:8000',
            resume: 'http://localhost:8000/resume',
            predict: 'http://localhost:8000/predict',
            match: 'http://localhost:8000/match',
            chat: 'http://localhost:8000/resume/chat'
          };
          localStorage.setItem("aiServices", JSON.stringify(fallbackAiServices));
          console.log('[Login] ⚠️ Using fallback AI services:', fallbackAiServices);
        }
        
        // Redirect based on access type
        switch (user.accesstype) {
          case "Student":
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.removeItem("recruiter"); // Clear recruiter session
            navigate('/student', { replace: true });
            break;
          case "Class Teacher":
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.removeItem("recruiter"); // Clear recruiter session
            navigate('/classteacher', { replace: true });
            break;
          case "Training and placement officer":
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.removeItem("recruiter"); // Clear recruiter session
            navigate('/tpo', { replace: true });
            break;
          case "Recruiter":
            // Recruiters: Save as recruiter session, clear user session
            const recruiterData = {
              _id: user._id || user.id || user.email,
              email: user.email,
              username: user.username || user.email,
              companyName: user.companyName || '',
              contactNumber: user.contactNumber || '',
              accesstype: "Recruiter",
              isApproved: user.isApproved !== false,
              createdBy: user.createdBy || user.tpoemail || '',
              approvedBy: user.approvedBy || ''
            };
            localStorage.setItem("recruiter", JSON.stringify(recruiterData));
            localStorage.removeItem("user"); // Clear regular user session
            navigate('/recruiter/dashboard', { replace: true });
            break;
          default:
            setError(`Unknown access type: ${user.accesstype}. Please contact support or use the appropriate login page.`);
            localStorage.removeItem("user");
            localStorage.removeItem("recruiter");
        }
      } else {
        setError("Invalid email or password. Please try again.");
      }

    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please check your credentials.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else if (err.message === 'Network Error') {
        setError("Network error. Please check your connection.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSignUp = () => {
    setsp(true);
  };

  return (
    <div className="login-page-wrapper" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div className="login-background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="container-fluid" style={{ maxWidth: '1200px', position: 'relative', zIndex: 1 }}>
        <div className="row justify-content-center align-items-center g-3">
          {/* Main Login Form Card */}
          <div className="col-12 col-lg-7 col-xl-6 mb-3 mb-lg-4">
            <div className="card glass-card fade-in login-card-mobile" style={{ 
              maxWidth: '550px', 
              margin: '0 auto',
              padding: '3rem 2.5rem',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Success Animation Overlay */}
              {logcode > 0 && (
                <div className="login-success-overlay" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(16, 185, 129, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '24px',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div className="text-center text-white">
                    <div className="spinner-border spinner-border-sm text-white mb-3" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h4 style={{ margin: 0, fontWeight: '600' }}>Login Successful!</h4>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Redirecting...</p>
                  </div>
                </div>
              )}

              <div className="text-center mb-4">
                <div style={{ 
                  marginBottom: '1.5rem',
                  animation: 'fadeInDown 0.6s ease-out'
                }}>
                  <img 
                    src="logo.png" 
                    alt="Logo" 
                    id="logo-login" 
                    style={{ 
                      marginBottom: '1rem',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />
                </div>
                <h1 className="text-gradient mb-3 login-title-mobile" style={{ 
                  fontSize: '2.25rem',
                  lineHeight: '1.3',
                  animation: 'fadeInUp 0.6s ease-out 0.2s both'
                }}>
                  Welcome Back
                </h1>
                <p className="text-muted login-subtitle-mobile" style={{ 
                  fontSize: '1.1rem',
                  marginBottom: '0',
                  animation: 'fadeInUp 0.6s ease-out 0.3s both'
                }}>
                  Sign in to access your account
                </p>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="alert alert-danger fade-in" role="alert" style={{
                  borderRadius: '12px',
                  padding: '0.875rem 1rem',
                  marginBottom: '1.5rem',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  animation: 'shake 0.5s ease-out'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span style={{ fontSize: '0.95rem' }}>{error}</span>
                </div>
              )}
              
              <form onSubmit={checkdata} className="mt-4" noValidate>
                <div className="mb-3" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
                  <label htmlFor="username" className="form-label" style={{ 
                    fontWeight: '600', 
                    color: '#0f172a',
                    marginBottom: '0.75rem',
                    fontSize: '0.95rem',
                    display: 'block'
                  }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id='username'
                      type="email"
                      name='username'
                      value={data.username}
                      onChange={islogin}
                      className={`form-control ${fieldErrors.username ? 'is-invalid' : ''}`}
                      placeholder='Enter your email'
                      required
                      disabled={loading}
                      style={{
                        paddingLeft: '2.75rem',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      fill="none" 
                      stroke="currentColor" 
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: fieldErrors.username ? '#dc2626' : '#64748b',
                        pointerEvents: 'none',
                        transition: 'color 0.3s ease'
                      }}
                    >
                      <path d="M2.5 6.5L10 11.5L17.5 6.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.5 13.5H17.5V6.5H2.5V13.5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {fieldErrors.username && (
                    <div className="invalid-feedback" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc2626' }}>
                      {fieldErrors.username}
                    </div>
                  )}
                </div>
                
                <div className="mb-3" style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label htmlFor="password" className="form-label" style={{ 
                      fontWeight: '600', 
                      color: '#0f172a',
                      marginBottom: '0',
                      fontSize: '0.95rem'
                    }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="btn btn-link p-0"
                      style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        textDecoration: 'none',
                        fontWeight: '500',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer'
                      }}
                      disabled={loading}
                    >
                      {showPassword ? '👁️ Hide' : '👁️ Show'}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id='password'
                      type={showPassword ? "text" : "password"}
                      name='password'
                      value={data.password}
                      onChange={islogin}
                      className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                      placeholder='Enter your password'
                      required
                      disabled={loading}
                      style={{
                        paddingLeft: '2.75rem',
                        paddingRight: '3rem',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      fill="none" 
                      stroke="currentColor" 
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: fieldErrors.password ? '#dc2626' : '#64748b',
                        pointerEvents: 'none',
                        transition: 'color 0.3s ease'
                      }}
                    >
                      <path d="M2.5 7.5C2.5 7.5 5 12.5 10 12.5C15 12.5 17.5 7.5 17.5 7.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 12.5C12.7614 12.5 15 10.2614 15 7.5C15 4.73858 12.7614 2.5 10 2.5C7.23858 2.5 5 4.73858 5 7.5C5 10.2614 7.23858 12.5 10 12.5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 9.5C10.8284 9.5 11.5 8.82843 11.5 8C11.5 7.17157 10.8284 6.5 10 6.5C9.17157 6.5 8.5 7.17157 8.5 8C8.5 8.82843 9.17157 9.5 10 9.5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {fieldErrors.password && (
                    <div className="invalid-feedback" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc2626' }}>
                      {fieldErrors.password}
                    </div>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-4" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                      style={{
                        width: '1.1rem',
                        height: '1.1rem',
                        cursor: 'pointer',
                        marginTop: '0.25rem'
                      }}
                    />
                    <label className="form-check-label" htmlFor="rememberMe" style={{
                      fontSize: '0.9rem',
                      color: '#64748b',
                      cursor: 'pointer',
                      marginLeft: '0.5rem',
                      userSelect: 'none'
                    }}>
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    style={{
                      fontSize: '0.9rem',
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontWeight: '500',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
                
                <div className="d-grid" style={{ animation: 'fadeInUp 0.6s ease-out 0.7s both' }}>
                  <button 
                    id='log-submit' 
                    type='submit' 
                    className='btn btn-success btn-responsive'
                    disabled={loading}
                    style={{ 
                      fontSize: '1.1rem', 
                      padding: '0.875rem',
                      position: 'relative',
                      minHeight: '48px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></span>
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <b>Sign In</b>
                    )}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="text-center my-4" style={{ position: 'relative' }}>
                <hr style={{ borderColor: 'rgba(15, 23, 42, 0.1)', margin: 0 }} />
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'white',
                  padding: '0 1rem',
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}>
                  or
                </span>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={handleSignUp}
                    className="btn btn-link p-0"
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontWeight: '600',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.95rem'
                    }}
                    disabled={loading}
                  >
                    Sign up here
                  </button>
                </p>
              </div>

              {/* Conditional Redirect */}
              {
                logcode === 1 ? <Navigate to="/student" replace /> :
                logcode === 2 ? <Navigate to="/classteacher" replace /> :
                logcode === 3 ? <Navigate to="/tpo" replace /> :
                null
              }
            </div>
          </div>

          {/* Welcome Side Card */}
          <div className="col-12 col-lg-5 col-xl-4">
            <div 
              className="card fade-in welcome-card-mobile" 
              style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '3rem 2rem',
                borderRadius: '24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-xl)',
                border: 'none',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <div className="welcome-content-mobile" style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1.5rem',
                  animation: 'bounceIn 0.8s ease-out'
                }}>
                  🎓
                </div>
                <h1 className="welcome-title-mobile" style={{ 
                  color: 'white', 
                  fontSize: '2rem',
                  marginBottom: '1rem',
                  fontWeight: '700',
                  lineHeight: '1.3'
                }}>
                  New Here?
                </h1>
                <p className="welcome-text-mobile" style={{ 
                  fontSize: '1.1rem',
                  opacity: 0.95,
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  Join our platform and unlock a world of opportunities. Create your account today and start your journey towards success.
                </p>
              </div>
              
              <button 
                id='log-submit' 
                onClick={handleSignUp} 
                className='btn btn-light btn-responsive'
                disabled={loading}
                style={{ 
                  fontSize: '1.1rem',
                  padding: '0.875rem 2rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <b>Create Account</b>
              </button>
              
              {
                Tosignup && <Navigate to="/signup" replace />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
