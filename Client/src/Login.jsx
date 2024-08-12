import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Login.css";


function Login({ socket }) {
  const [username, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  document.addEventListener("DOMContentLoaded", async () => {
    async function fetchCookie() {
      try {
        const response = await fetch("http://localhost:3000/get-cookie", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        console.log("data", data);  
        if (data.sessionId) {
          socket.emit("existingCookie", data.sessionId);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching cookie:", error);
      }
    }

    fetchCookie();
  });

  socket.on("login_existUser", (username) => {
    console.log("login_existUser", username);
    if(username){
    navigate(`/chat/${username}`);
    }
  });


  async function setCookie(sessionId, username) {
    try {
      const response = await fetch("http://localhost:3000/set-cookie", {
        method: "POST",
        credentials: "include", 
        body: JSON.stringify({ sessionId: sessionId }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Cookie set:", data);
      navigate(`/chat/${username}`);
    } catch (error) {
      console.error("Error setting cookie:", error);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      socket.emit("login", { username, password });

      socket.on("login_success", (sessionId) => {
        // console.log('sessionId', sessionId);
        setCookie(sessionId, username);
        // console.log(username,data.username);
        // document.cookie = `sessionId=${sessionId}; path=/`;
        // navigate(`/chat/${username}`);

      });

      socket.on("error", (err) => {
        setError(err);
      });
    }
  };


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

export default Login;
