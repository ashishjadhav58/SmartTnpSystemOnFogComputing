import React, { useEffect } from 'react'

export default function Tp() {
    const backendUrl = localStorage.getItem('fogIp') || 'http://localhost:5000';
    useEffect(()=>{
        const show = async ()=>{
            try{
                const response = await axios.get(`${backendUrl}/accounts`);
                console.log(response.data);                
            }
            catch(error){
                console.log("error");                
            }
        }
        show()
    },[])
    
  return (
    <div>
      
    </div>
  )
}
