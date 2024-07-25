import React, { useState } from 'react';

import io from 'socket.io-client';
import App from './App';
import './App.css';
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';

function UserAuth({ socket }) {
  const [username, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate(); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      socket.emit('login', { username, password });
      setAuthenticated(true); 
    }
  };

  if (authenticated) {
    navigate(`/chat/${username}`);
   }

  return (
    <div className="App">
      <h2>Chat App - Login</h2>
      <form id="form" onSubmit={handleSubmit} className="form">
        <input
          type="text"
          id="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsernameInput(e.target.value)}
        />
        <input
          type="password"
          id="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default UserAuth;