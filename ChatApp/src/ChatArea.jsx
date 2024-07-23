import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3000'); // Ensure this URL is correct

function ChatArea({ username }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Listen for regular messages
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, { text: msg, type: 'received' }]);
    });

    // Listen for private messages
    socket.on('private_message', (data) => {
      console.log("private_message", data);
      setMessages((prevMessages) => [...prevMessages, { data, type: 'received' }]);
    });

    // Listen for updates to the user list
    socket.on('update_users', (userList) => {
      console.log("update_users", userList);
      setUsers(Object.values(userList));
    });

    // Cleanup on unmount
    return () => {
      socket.off('message');
      socket.off('private_message');
      socket.off('update_users');
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      if (recipient.trim()) {
        console.log("recipient", recipient);  
        socket.emit('private_message', { recipientUsername: recipient, message: input });
      } else {
        socket.emit('message', input);
      }
      setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
      setInput('');
    }
  };

  return (
    <div className="App">
      <h2>Chat App - {username}</h2>
      
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