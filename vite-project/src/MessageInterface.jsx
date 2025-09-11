import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";

export default function MessageInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const { end1, end2 } = location.state || {};
  console.log(end1 + " " + end2);
  
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await axios.get(`http://192.168.0.105:5000/api/message/get/perticular/${end1}/${end2}`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    getData();
    const interval = setInterval(getData, 5000);
    return () => clearInterval(interval);
  }, [end1, end2]);

  const sendMessage = async () => {
    if (message.trim() === "") return;

    try {
      await axios.post("http://192.168.0.105:5000/api/message", {
        sender: end1,
        receiver: end2,
        msg: message
      });
      setData(prev => [...prev, { sender: end1, receiver: end2, msg: message }]);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const gotohomepage = () => {
    if (user.accesstype === "Student") navigate("/student");
    else if (user.accesstype === "Class Teacher") navigate("/classteacher");
    else if (user.accesstype === "Training and placement officer") navigate("/tpo");
  };

  return (
    <>
      <div className="container">
        <div className="row mt-5">
          <div className="col-sm-2 text-start">
            <button className='btn btn-primary' onClick={gotohomepage}>
              Back
            </button>
          </div>
        </div>
      </div>

      <div style={{ width: "50%", margin: "auto", border: "1px solid #ccc", borderRadius: "10px", padding: "10px" }}>
        {/* Chat Box */}
        <div style={{ maxHeight: "400px", overflowY: "auto", padding: "10px" }}>
          {data.map((e, index) => (
            <div key={index} style={{
              display: "flex",
              justifyContent: e.sender === end1 ? "flex-end" : "flex-start",
              marginBottom: "10px"
            }}>
              <div style={{
                background: e.sender === end1 ? "#007bff" : "#f1f1f1",
                color: e.sender === end1 ? "white" : "black",
                padding: "10px",
                borderRadius: "10px",
                maxWidth: "60%"
              }}>
                {e.msg}
              </div>
            </div>
          ))}
        </div>

        {/* Input Field & Send Button */}
        <div style={{ display: "flex", marginTop: "10px" }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: "1", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
          />
          <button
            onClick={sendMessage}
            style={{ marginLeft: "5px", padding: "8px 12px", background: "#007bff", color: "white", borderRadius: "5px", border: "none" }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
