import React, { useState } from 'react';
import io from 'socket.io-client';
import App from './App';
import './App.css';

const socket = io('http://localhost:3000'); 

function UserAuth() {
  const [username, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      socket.emit('login', { username, password });
      setAuthenticated(true); 
    }
  };

  if (authenticated) {
    return <App username={username} />;
  }

  return (
    <div className="App">
      <h2>Chat App - Login</h2>
      <form id="form" onSubmit={handleSubmit}>
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
