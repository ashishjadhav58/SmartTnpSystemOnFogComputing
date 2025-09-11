import React from 'react'
import Loginpage from './Loginpage'
import Register from './Register'
import HPstudent from './HPstudent'
import { Route, Routes } from "react-router-dom";
import StTNPEvent from './StTNPEvent';
import StSelfattendence from './StSelfattendence';
import Stplacementdrive from './Stplacementdrive';
import StINTERVIEWINFORMATIONGROUPS from './StINTERVIEWINFORMATIONGROUPS';
import Stddashboard from './Stddashboard';
import HPTPO from './HPTPO'
import HPclassteacher from './HPclassteacher'
import MessageInterface from './MessageInterface';
export default function App() {
  return (
    <div>
      <Routes>
                <Route path="/" element={<Loginpage/>} />
                <Route path="/signup" element={<Register />} />
                <Route path="/student" element={<HPstudent />} />
                <Route path="/student" element={<HPstudent />} />
                <Route path="/message" element={<MessageInterface/>} />
                <Route path="/tpo" element={<HPTPO />} />
                <Route path="/classteacher" element={<HPclassteacher />} />
                

      </Routes>
    </div>
  )
}
