import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/SignUp.css';

function Signup({ socket }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('error', (err) => {
      setError(err);
    });

    return () => {
      socket.off('error');
    };
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username.trim() && password.trim() && email.trim() && confirmedPassword.trim()) {
      if (password !== confirmedPassword) {
        setError('Passwords do not match');
      } else {
        socket.emit('signup', { username, password, email });

        socket.on('signup_success', () => {
          console.log(`${username} has signed up`);
          setError('');
          navigate('/');
        });
      }
    } else {
      setError('Please fill all the fields');
    }
  };

  return (
    <div className="Signup">
      <h2 className="heading">CHATTER-BOX</h2>
      <form id="signupForm" onSubmit={handleSubmit} className="form">
        <input
          type="text"
          id="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          id="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="email"
          id="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          id="confirmedPassword"
          placeholder="Confirm Password"
          value={confirmedPassword}
          onChange={(e) => setConfirmedPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="signupButton">Sign Up</button>
      </form>
    </div>
  );
}

export default Signup;