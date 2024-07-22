import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3000'); // Ensure this URL is correct

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('connection', () => {
      console.log('connected');
    });
 
    socket.on('message', (msg) => {
      console.log(msg);
      setMessages((prevMessages) => [...prevMessages,{ text: msg, type: 'received' }]);
    });

    return () => {
      socket.off('message');
      socket.disconnect();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('message', input);
      // setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
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
