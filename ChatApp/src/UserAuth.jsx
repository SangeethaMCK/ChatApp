import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserAuth.css';

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
    <div className="UserAuth">
      <h2 className="heading">CHATTER-BOX</h2>
      <form id="loginForm" onSubmit={handleSubmit} className="form">
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
        <button type="submit" className="loginButton">Login</button>
      </form>
    </div>
  );
}

export default UserAuth;