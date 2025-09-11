import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StINTERVIEWINFORMATIONGROUPS() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  function openChat(role) {
    if (role === "tpo") {
      navigate("/message", { state: { end1: user.email, end2: user.tpoemail} });
    } else if (role === "class") {
      navigate("/message", { state: { end1: user.email, end2: user.classemail } });
    }
  }

  return (
    <div className="container">
      <div className="row">
        <button className='btn btn-danger mt-3' onClick={() => openChat("tpo")}>
          CHAT WITH TPO
        </button>
      </div>
      <div className="row">
        <button className='btn btn-danger mt-3' onClick={() => openChat("class")}>
          CHAT WITH CLASS TEACHER
        </button>
      </div>
    </div>
  );
}
