import { BrowserRouter as BrowserRouter, Route, Routes } from 'react-router-dom'
import ChatArea from './ChatArea.jsx'
import UserAuth from './UserAuth.jsx'
import App from './App.jsx'
import SignUp from './Signup.jsx'

import io from 'socket.io-client';

const socket = io('http://192.168.0.115:3001');

function Chatapp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserAuth socket={socket} />} />
        <Route path="/signup" element={<SignUp socket={socket} />} />
        <Route path="/chat/:username" element={<App  socket={socket} />} />
        <Route path="/chat/:username/:recipient" element={<ChatArea  socket={socket} />} />
        <Route path="/chat/:username/room/:roomName" element={<ChatArea  socket={socket} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Chatapp;