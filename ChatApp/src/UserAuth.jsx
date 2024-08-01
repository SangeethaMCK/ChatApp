import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserAuth.css";

function UserAuth({ socket }) {
  const [username, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      socket.emit("login", { username, password });
      socket.on("login_success", () => {
        navigate(`/chat/${username}`);
      });
    }
  };

  socket.on("error", (err) => {
    setError(err);
  });

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
        {error && <p className="error">{error}</p>}
        <div className="loginButtons">
          <button type="submit" className="loginButton">
            Login
          </button>
          <button className="signUpButton" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserAuth;
