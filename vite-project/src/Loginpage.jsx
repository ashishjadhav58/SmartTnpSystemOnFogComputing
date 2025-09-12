import React, { useState } from 'react';
import './style.css';
import { Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setBackendUrl } from "./store/backendSlice";
export default function Loginpage() {
  const dispatch = useDispatch();
  const [logcode, setlogcode] = useState(0);
  const [data, setdata] = useState({
    username: '',
    password: ''
  });
  const [Tosignup, setsp] = useState(false);

  const islogin = (event) => {
    const { name, value } = event.target;
    setdata(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const checkdata = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(
        "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/signin",
        {
          username: data.username,
          password: data.password
        }
      );
      console.log(response);

      const user = response.data?.data;
      console.log(user);
      const fogIp = response.data.ip;
      console.log(fogIp)
      if (user) {
        dispatch(setBackendUrl(fogIp));
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("fogIp", fogIp);
        switch (user.accesstype) {
          case "Student":
            setlogcode(1);
            break;
          case "Class Teacher":
            setlogcode(2);
            break;
          case "Training and placement officer":
            setlogcode(3);
            break;
          default:
            alert("Unknown access type");
        }
      } else {
        alert("Login failed: Invalid username or password");
      }

    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please try again.");
    }

    // Clear inputs
    setdata({
      username: '',
      password: ''
    });
  };

  function changes() {
    setsp(true);
  }

  return (
    <div>
      <div className="conatiner-fluid bg bg-grey pd-5">
        <div className="row justify-content-center">
          <div className="col-sm-8 text-center mt-5">
            <div className="row">
              <div className="col-sm-1">
                <img className='ms-5' src="logo.png" alt="Logo" id="logo-login" />
              </div>
            </div>
            <br /><br />
            <h1 className='mt-5'>LOGIN TO YOUR ACCOUNT</h1>
            <div className="row justify-content-center">
              <div className="col-sm-6">
                <form onSubmit={checkdata}>
                  <hr /><br />
                  <input
                    id='log'
                    type="text"
                    name='username'
                    value={data.username}
                    onChange={islogin}
                    className="bg bg-grey border border-grey form-control"
                    placeholder='  Email -Id'
                  /><br />
                  <input
                    id='log'
                    type="password"
                    name='password'
                    value={data.password}
                    onChange={islogin}
                    className="bg bg-grey border border-grey form-control"
                    placeholder='  Password'
                  /><br /><br />
                  <button id='log-submit' type='submit' className='btn btn-success'><b>Sign In</b></button>
                </form>
                <br /><br /><br /><br /><br /><br />

                {/* Conditional Redirect */}
                {
                  logcode === 1 ? <Navigate to="/Student" replace /> :
                  logcode === 2 ? <Navigate to="/classteacher" replace /> :
                  logcode === 3 ? <Navigate to="/tpo" replace /> :
                  null
                }

              </div>
            </div>
          </div>

          <div className="col-sm-4 bg bg-success text-center">
            <br /><br /><br /><br /><br /><br /><br /><br /><br />
            <h1 className='text text-light'>Welcome to Sign In</h1><br />
            <h6 className='text text-light'>Don't have an account?</h6><br />
            <button id='log-submit' onClick={changes} className='bg bg-light border border-light'>
              <b>Sign Up</b>
            </button>
            {
              Tosignup && <Navigate to="/Signup" replace />
            }
          </div>
        </div>
      </div>
    </div>
  );
}
