import React, { useEffect } from 'react'

export default function Tp() {
    useEffect(()=>{
        const show = async ()=>{
            try{
                const response = await axios.get("http://192.168.0.105:5000/accounts");
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
