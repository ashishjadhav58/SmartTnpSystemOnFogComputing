import React, { useState } from 'react'
import './style.css'
import { Navigate } from "react-router-dom";
export default function ProfileEdit() {
    const [patch,setpatch]=useState({})
    const [gotolog,setgotolog] = useState(0)
    const storedUser = JSON.parse(localStorage.getItem("user"));
    console.log(storedUser);
    
    const setdata = (event) => {
        const { name, value } = event.target;
        setpatch(prevState => ({
          ...prevState,
          [name]: value
        }));
      };

    const update = async (event)=>{
        event.preventDefault();
        if(patch.confirm === storedUser.password){
            console.log(true);
            try{
                const response = await axios.patch(`http://192.168.0.105:5000/api/accounts/${storedUser._id}`, patch, {
                    headers: { 'Content-Type': 'application/json' }
                })
                console.log(response);
                alert("Successfully done")
                setpatch({
                    username: "",
                    email: "",
                    tpoemail: "",
                    classemail: "",
                    password: "",
                    confirm :""
                  });
                reload();
                }
            catch(error){
                console.log("404");
            }
            
            setgotolog(1)
            localStorage.removeItem("user");
        }
        else{
            alert("Enter correct password")
        }
    }
    function reload(){
        window.location.reload();
    }
    const [typo ,settypo] = useState(0)
    function changetype(event){
        const a = parseInt(event.target.value);
        settypo(a)
    }
    
  return (
    <div>   {
        gotolog === 1 ? <Navigate to="/" replace={true} />:""
        }
            <div className="container ms-5 mt-4">
                <div className="row justify-content-center bg bg-light border border-dark rounded">
                    <div className="col-sm-6 m-4">
                        <br /><h1 className='text text-light text-center'>Accounts Center</h1><br /><br />
                       <form onSubmit={update}>
                        <select onChange={changetype} className='text text-secondary text-center' id='log' name="Changetype">
                            <option value="0">Choose any option</option>
                            <option value="1">Change Email address</option>
                            <option value="2">Change Username</option>
                            { storedUser.accesstype === "Student" ?<><option value="3">Change Class Teacher Id</option>
                            <option value="4">Change TPO ID</option></> : storedUser.accesstype === "Class Teacher" ?  <><option value="4">Change TPO ID</option></> : ""  }
                            <option value="5">Change Password</option>
                        </select><br /><br /><br />
                        {
                            typo ===1?<input onChange={setdata} name='email' value={patch.email} type="text" id='log' placeholder='  New Email Id' />:typo ===2?<input name='username' onChange={setdata} value={patch.username}  type="text" id='log' placeholder='  New Username'  />:typo ===3?<input name='classemail' onChange={setdata} value={patch.classemail}  type="email" id='log' placeholder='  New Class Teacher Mail Id' />:typo ===4?<input name='tpoemail' type="email" id='log' onChange={setdata} value={patch.tpoemail} placeholder='  New Tpo Mail Id'/>:typo ===5?<input name='password' onChange={setdata} type="text" id='log' value={patch.password} placeholder='  New password ' />:""
                        }
                        {
                            typo > 0?<><br /><br /><input onChange={setdata} value={patch.confirm} name='confirm' type="text" id='log' placeholder='  Enter password' /><br /><br /><br /><button id='log2' className='text-center btn btn-light '> Update</button><br /><br /></>:""
                        }</form>
                    </div>
                </div>
            </div>
    </div>
  )
}
