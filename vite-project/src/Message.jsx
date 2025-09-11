import React, { useEffect, useState } from "react";
import moment from "moment";
import "./style.css";
import { useSelector } from "react-redux";

export default function Message() {
  const [data, setData] = useState([]);
  const backendUrl = useSelector((state) => state.backend.backendUrl);

  useEffect(() => {
    const getData = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (!storedUser || !storedUser.email) return;
      const mail = storedUser.email;

      try {
        const response = await axios.post(`${backendUrl}/api/message/gett/${mail}`);
        setData(response.data);
      } catch (e) {
        console.log("Error fetching messages:", e);
      }
    };

    getData();
    const interval = setInterval(getData, 5000);
    return () => clearInterval(interval);
  }, []);

  const seen = async (event) => {
    const id = event.currentTarget.id;
    try {
      await axios.patch(`${backendUrl}/api/message/${id}`, { read: true });

      // Remove the read message from UI
      setData((prevData) => prevData.filter((msg) => msg._id !== id));
    } catch (e) {
      console.log("Error updating message:", e);
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="text-center text-primary fw-bold">📩 New Messages</h4>
      <div className="row justify-content-center mt-3">
        <div className="col-md-8">
          {data.length > 0 ? (
            data.slice().reverse().map((e) => (
              <div 
                key={e._id} 
                id={e._id} 
                onClick={seen}
                className="card shadow-sm p-3 mb-3 bg-light border-primary hover:shadow-lg cursor-pointer"
                style={{ borderRadius: "10px", transition: "0.3s" }}
              >
                <div className="card-body">
                  <h6 className="text-dark"><strong>Sender:</strong> {e.sender}</h6>
                  <p className="text-muted">{e.msg}</p>
                  <small className="text-end text-secondary d-block">
                    {moment(e.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted mt-4">No new messages.</p>
          )}
        </div>
      </div>
    </div>
  );
}
