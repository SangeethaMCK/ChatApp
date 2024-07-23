import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';


function App({ username , socket }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Handle session data
    socket.on('session', ({ sessionID, userID }) => {
      socket.auth = { sessionID };
      localStorage.setItem('sessionID', sessionID);
      socket.userID = userID;
    });

    // Listen for regular messages
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, { text: msg, type: 'received' }]);
    });

    // Listen for private messages
    socket.on('private_message', ({ content, from }) => {
      setMessages((prevMessages) => [...prevMessages, { text: content, type: 'received', from }]);
    });

    // Listen for updates to the user list
    socket.on('update_users', (userList) => {
      console.log("userList", userList );
      setUsers(userList.map(user => user.username));
    });

    // Listen for user connected
    socket.on("user connected", (user) => {
      setUsers((prevUsers) => [...prevUsers, user.username]);
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
        console.log("username", username);  
        socket.emit('private_message', { content: input, to: recipient, from: username });
      } else {
        socket.emit('message', input);
      }
      setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
      setInput('');
    }
  };

  const handleUserClick = (e) => {
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
            {msg.text} {msg.from && `from ${msg.from}`}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
