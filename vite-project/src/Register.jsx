import React, { useState } from 'react'
import { Navigate } from "react-router-dom";
import './style.css';

export default function Register() {
    const [data,setdata]=useState({})
    const newdata = (event) => {
      const { name, value } = event.target;
      setdata(prevState => ({
        ...prevState,
        [name]: value
      }));
    };
    

    const senddata = async (event) => {
      event.preventDefault();  
      try {
      const response = await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/signup",data,{
        headers: { 'Content-Type': 'application/json' }       
      })
      console.log(response.data);
      setdata({
        username: "",
        email: "",
        accesstype: "",
        tpoemail: "",
        classemail: "",
        password: "",
      });
      alert("Sign up process is done successfully")
      }
      catch(error){
        console.log("404 not found");
        
      }
    };
    const [log,setlog] = useState(false)
    const [type1,settype]=useState(0);
    function typesetting(e){
        let ch = e.target.value;
               if(ch==="Class Teacher"){
                    settype(1)
               }
               else if(ch==="Student"){
                    settype(2)
               }
               else{
                settype(0)
               }   

    }
    function changetolog(){
      setlog(true)
    }
  return (
    <div className="modern-container" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="container-fluid" style={{ maxWidth: '100%' }}>
        <div className="row justify-content-center align-items-center g-3">
          {/* Welcome Side Card */}
          <div className="col-12 col-lg-4 col-xl-4 mb-3 mb-lg-4 order-2 order-lg-1">
            <div 
              className="card fade-in welcome-card-mobile" 
              style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '3rem 2rem',
                borderRadius: '24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-xl)',
                border: 'none'
              }}
            >
              <div className="welcome-content-mobile" style={{ marginBottom: '2rem' }}>
                <h1 className="welcome-title-mobile" style={{ 
                  color: 'white', 
                  fontSize: '2rem',
                  marginBottom: '1rem',
                  fontWeight: '700',
                  lineHeight: '1.3'
                }}>
                  Already Have an Account?
                </h1>
                <p className="welcome-text-mobile" style={{ 
                  fontSize: '1.1rem',
                  opacity: 0.95,
                  marginBottom: '2rem',
                  lineHeight: '1.5'
                }}>
                  Sign in to continue your journey
                </p>
              </div>
              
              <button 
                id='log-submit' 
                onClick={changetolog} 
                className='btn btn-light btn-responsive'
                style={{ 
                  fontSize: '1.1rem',
                  padding: '0.875rem 2rem',
                  fontWeight: '600',
                  borderRadius: '12px'
                }}
              >
                <b>Sign In</b>
              </button>
              
              {
                log && <Navigate to="/" replace={true} />
              }
            </div>
          </div>

          {/* Registration Form Card */}
          <div className="col-12 col-lg-8 col-xl-7 order-1 order-lg-2">
            <div className="card glass-card fade-in login-card-mobile" style={{ 
              maxWidth: '700px', 
              margin: '0 auto',
              padding: '3rem 2.5rem',
              borderRadius: '24px'
            }}>
              <div className="text-center mb-4">
                <img 
                  src="logo.png" 
                  alt="Logo" 
                  id="logo-login" 
                  style={{ marginBottom: '1.5rem' }}
                />
                <h1 className="text-gradient mb-3 login-title-mobile" style={{ 
                  fontSize: '2.25rem',
                  lineHeight: '1.3'
                }}>
                  Create Your Account
                </h1>
                <p className="text-muted login-subtitle-mobile" style={{ 
                  fontSize: '1.1rem',
                  marginBottom: '0'
                }}>
                  Join us and start your journey today
                </p>
              </div>
              
              <form onSubmit={senddata} className="mt-4">
                <div className="row">
                  <div className="col-12 mb-3">
                    <label htmlFor="username" className="form-label" style={{ 
                      fontWeight: '500', 
                      color: '#0f172a',
                      marginBottom: '0.5rem'
                    }}>
                      Username
                    </label>
                    <input 
                      id='log' 
                      onChange={newdata} 
                      type="text" 
                      name='username' 
                      value={data.username || ''} 
                      className="form-control" 
                      placeholder='Enter your username' 
                      required
                    />
                  </div>
                  
                  <div className="col-12 mb-3">
                    <label htmlFor="email" className="form-label" style={{ 
                      fontWeight: '500', 
                      color: '#0f172a',
                      marginBottom: '0.5rem'
                    }}>
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      onChange={newdata} 
                      value={data.email || ''} 
                      className="form-control" 
                      name="email" 
                      id='log' 
                      placeholder='Enter your email' 
                      required
                    />
                  </div>
                  
                  <div className="col-12 mb-3">
                    <label htmlFor="accesstype" className="form-label" style={{ 
                      fontWeight: '500', 
                      color: '#0f172a',
                      marginBottom: '0.5rem'
                    }}>
                      Account Type
                    </label>
                    <select 
                      value={data.accesstype || ''} 
                      onChange={(event) => {
                        newdata(event);
                        typesetting(event);
                      }} 
                      className='form-control' 
                      name="accesstype" 
                      id="log" 
                      required
                    >
                      <option value="">Choose category</option>
                      <option value="Training and placement officer">Training and placement officer</option>
                      <option value="Class Teacher">Class Teacher</option>
                      <option value="Student">Student</option>
                    </select>
                  </div>
                  
                  {
                    type1 === 1 ? (
                      <div className="col-12 mb-3">
                        <label htmlFor="tpoemail" className="form-label" style={{ 
                          fontWeight: '500', 
                          color: '#0f172a',
                          marginBottom: '0.5rem'
                        }}>
                          TPO Email ID
                        </label>
                        <input 
                          onChange={newdata} 
                          name='tpoemail' 
                          value={data.tpoemail || ''} 
                          id='log' 
                          type="email" 
                          className="form-control" 
                          placeholder='Enter TPO email ID' 
                          required
                        />
                      </div>
                    ) : type1 === 2 ? (
                      <>
                        <div className="col-12 mb-3">
                          <label htmlFor="tpoemail" className="form-label" style={{ 
                            fontWeight: '500', 
                            color: '#0f172a',
                            marginBottom: '0.5rem'
                          }}>
                            TPO Email ID
                          </label>
                          <input 
                            onChange={newdata} 
                            name='tpoemail' 
                            value={data.tpoemail || ''} 
                            id='log' 
                            type="email" 
                            className="form-control" 
                            placeholder='Enter TPO email ID' 
                            required
                          />
                        </div>
                        <div className="col-12 mb-3">
                          <label htmlFor="classemail" className="form-label" style={{ 
                            fontWeight: '500', 
                            color: '#0f172a',
                            marginBottom: '0.5rem'
                          }}>
                            Class Teacher Email ID
                          </label>
                          <input 
                            onChange={newdata} 
                            name='classemail' 
                            value={data.classemail || ''} 
                            id='log' 
                            type="email" 
                            className="form-control" 
                            placeholder='Enter Class Teacher email ID' 
                            required
                          />
                        </div>
                      </>
                    ) : ""
                  }
                  
                  <div className="col-12 mb-4">
                    <label htmlFor="password" className="form-label" style={{ 
                      fontWeight: '500', 
                      color: '#0f172a',
                      marginBottom: '0.5rem'
                    }}>
                      Password
                    </label>
                    <input 
                      name='password' 
                      onChange={newdata} 
                      value={data.password || ''} 
                      id='log' 
                      type="password" 
                      className="form-control" 
                      placeholder='Enter your password' 
                      required
                    />
                  </div>
                </div>
                
                <div className="d-grid">
                  <button 
                    id='log-submit' 
                    type='submit' 
                    className='btn btn-success btn-responsive'
                    style={{ fontSize: '1.1rem', padding: '0.875rem' }}
                  >
                    <b>Sign Up</b>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
