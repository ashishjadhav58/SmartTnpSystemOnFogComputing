import React, { useState } from 'react'

import { Navigate } from "react-router-dom";

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
       <div>
      <div className="conatiner-fluid bg bg-grey pd-5">
        <div className="row justify-content-center ">
            <div className="col-sm-4 bg bg-success text-center"><br /><br /><br /><br /><br /><br /><br /><br /><br />
                <h1 className='text text-light'>Welcome to Sign Up </h1><br />
                <h6 className='text text-light'>Do have an account ? </h6><br />
                <button id='log-submit' onClick={changetolog} className='bg bg-light border border-light'>
                  <b>Sign In</b>
                </button>
                {
                  log && <Navigate to="/"  replace={true} />
                }
            </div>
            <div className="col-sm-8   text-center mt-5 ">
              <div className="row">
                <div className="col-sm-1">
                  <img className='ms-5' src="logo.png" alt="" id="logo-login"/>
                </div>
              </div>
              <h1 className='mt-4'>CREATE YOUR OWN ACCOUNT</h1>
                <div className="row justify-content-center">
               <div className="col-sm-6">
               <form onSubmit={senddata}>
                    <hr /><br />
                    <input id='log' onChange={newdata} type="text" name='username' value={data.username} className=" bg bg-grey border border-grey form-control" placeholder='  Username' required/><br />
                    <input type="email" onChange={newdata} value={data.email}  className=" bg bg-grey border border-grey form-control" name="email" id='log' placeholder='  Email' required/><br />
                    <select value={data.accesstype}  onChange={(event) => {
                      newdata(event);
                      typesetting(event);
                    }} className='text text-secondary border border-grey' name="accesstype" id="log" required>
                        <option value="Choose category">&nbsp; &nbsp; Choose category</option>
                        <option value="Training and placement officer">&nbsp; &nbsp;Training and placement officer</option>
                        <option value="Class Teacher">&nbsp; &nbsp;Class Teacher</option>
                        <option value="Student">&nbsp; &nbsp;Student</option>
                    </select>
                    <br /><br />
                        {
                        type1 === 1 ? (
                           <> <input onChange={newdata} name='tpoemail' value={data.tpoemail} id='log' type="email" className=" bg bg-grey border border-grey form-control" placeholder='  TPO ID' required/><br /></>
                        ) : type1 === 2 ? (
                            <>
                            <input onChange={newdata} name='tpoemail' value={data.tpoemail} id='log' type="email" className=" bg bg-grey border border-grey form-control" placeholder='  TPO MAIL ID' required/><br />
                            <input onChange={newdata} name='classemail' value={data.classemail} id='log' type="email" className=" bg bg-grey border border-grey form-control" placeholder='  Class Teacher MAIL ID' required/><br /></>
                        ) : ""
                    }
                    <input name='password' onChange={newdata} value={data.password} id='log' type="password" className="bg bg-grey border border-grey form-control " placeholder='  Password' required/><br /><br />
                    
                <br /><br />
                <button id='log-submit' type='submit' className='btn btn-success'><b>Sign Up</b></button>
                </form>
                <br /><br /><br /><br /><br /><br />
               </div>
                </div>
            </div>
        </div>
      </div>
    
    </div>
  )
}
