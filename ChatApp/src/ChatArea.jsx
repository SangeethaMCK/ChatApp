import React, { useEffect, useState } from 'react';
import './App.css';

function ChatArea({ username, socket, recipient }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for regular messages
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, { text: msg, type: 'received' }]);
    });

    // Listen for private messages
    socket.on('private_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, { text: data.content, type: 'received', from: data.from }]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('message');
      socket.off('private_message');
    };
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      if (recipient.trim()) {
        socket.emit('private_message', { content: input, to: recipient, from: username });
      } else {
        socket.emit('message', input);
      }
      setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
      setInput('');
    }
  };

  return (
    <div className="ChatArea">
      <h2>{username}- Chat with {recipient}</h2>
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

export default ChatArea;
