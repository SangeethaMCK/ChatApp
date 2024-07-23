import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3000'); // Ensure this URL is correct

function App({ username }) {
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
    socket.on('private_message_data', ({ content, from }) => {
      console.log("private_message", { content, from });
      setMessages((prevMessages) => [...prevMessages, { text: content, from, type: 'private' }]);
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
        socket.emit('private_message', { content: input, to: recipient });
        setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent', recipient }]);
      } else {
        socket.emit('message', input);
        setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
      }
      setInput('');
    }
  };

  const handleUserClick = (e) => {
    console.log("handleUserClick", e.target.innerText);
    setRecipient(e.target.innerText);
  };

  return (
    <div className="App">
      <h2>Chat App - {username}</h2>
      <div>
        <h3>Users:</h3>
        <div className='users' onClick={handleUserClick}>
          {users.map((user, index) => (
            <div key={index}>{user}</div>
          ))}
        </div>
      </div>
      <form id="form" onSubmit={handleSubmit}>
        <input
          type="text"
          id="recipient"
          placeholder="Recipient username (optional)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
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
            {msg.text} {msg.type === 'private' && `(from: ${msg.from})`}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
