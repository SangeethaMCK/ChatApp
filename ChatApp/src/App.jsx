import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const socket = io(); 

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected');
    });

    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, { text: msg, type: 'received' }]);
    });

    return () => {
      socket.disconnect(); 
    };
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('message', input);
      setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
      setInput('');
    }
  };

  return (
    <div className="App">
      <form id="form" onSubmit={handleSubmit}>
        <input
          type="text"
          id="input"
          placeholder="Enter your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
      <div id="messages">
        {messages.map((msg, index) => (
          <p key={index} className={`message ${msg.type}`}>
            {msg.text}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
