import React, { useEffect, useState } from 'react';
import './App.css';
import { useParams } from 'react-router';

function ChatArea({ socket }) {
  const { username, recipient, roomName } = useParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit('load_messages', username);

    // Listen for regular messages
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, { text: msg, type: 'received' }]);
    });

    // Listen for private messages
    socket.on('private_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, { text: data.content, type: 'received', from: data.from }]);
    });

    // Listen for room messages
    socket.on('room_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, { text: data.content, type: 'received', from: data.from }]);
    });

    // Join room if specified
    if (roomName) {
      socket.emit('join_room', roomName);
    }

    // Cleanup on unmount
    return () => {
      socket.off('message');
      socket.off('private_message');
      socket.off('room_message');
      if (roomName) {
        socket.emit('leave_room', roomName);
      }
    };
  }, [socket, username, roomName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      if (recipient.trim()) {
        socket.emit('private_message', { content: input, to: recipient, from: username });
      } else if (roomName.trim()) {
        socket.emit('room_message', { content: input, roomName, from: username });
      } else {
        socket.emit('message', input);
      }
      setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
      setInput('');
    }
  };

  return (
    <div className="ChatArea">
      <h2>{username} - Chat with {recipient || `room ${roomName}`}</h2>
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
