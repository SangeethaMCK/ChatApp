import React, { useEffect, useState } from 'react';
import './App.css';
import { useParams } from 'react-router';

function ChatArea({ socket }) {
  const [users, setUsers] = useState([]);
  const { username, recipient, roomName } = useParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState('');

  useEffect(() => {
    socket.emit('get_users');
    socket.on('update_users', (users) => {
      setUsers(users);
    });
    // Join room if specified
    if (roomName) {
      socket.emit('join_room', roomName);
    }

    socket.on('private_message', (data) => {
      if(data.to === username && data.from === recipient) {
      setMessages((prevMessages) => [...prevMessages, { text: data.content, type: 'received'}]);
    }  });
  

    socket.on('room_message', ({ content, from }) => {
      setMessages((prevMessages) => [...prevMessages, { text: content, type: 'received', from }]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('private_message');
      socket.off('room_message');
    };
  }, [socket, roomName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('recipient', recipient, 'roomName', roomName, 'username', username);
      if (recipient) {
        socket.emit('private_message', { content: input, to: recipient, from: username });
      } else if (roomName) {
        socket.emit('room_message', { content: input, roomName, from: username });
      } 
      setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
      setInput('');
    }
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    let friendUsername = friend.trim();
    if (friendUsername) {
      socket.emit('add_friend', { roomName, friendUsername });
      setFriend('');
    }
  };

  return (
    <div className="ChatArea">
      <h2>{username} - Chat with {recipient || `room ${roomName}`}</h2>
      
      {roomName && (
        <div className='addFriend'>
          <h3>Add a friend:</h3>
          <form id="addFriendForm" onSubmit={handleAddFriend}>
            <input
              type="text"
              id="friendInput"
              placeholder="Enter username here..."
              value={friend}
              onChange={(e) => setFriend(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
          {/* <div className='dropdown'>
          <button> Add Friend </button>
          <div className='dropdown-content'>
            {users && users.map((user, index) => (
              <div key={index} onClick={() => {setFriend(user), handleAddFriend(user)}}>
                {user}
              </div>
            ))}
            
        </div>
        </div> */}
        </div>
      )}

      <form id="messageForm" onSubmit={handleSubmit}>
        <input
          type="text"
          id="messageInput"
          placeholder="Enter your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>

      <div id="messages">
        {messages.map((msg, index) => (
          <p key={index} className={`message ${msg.type}`}>
            {msg.from ? `${msg.from}: ` : ''}{msg.text}
          </p>
        ))}
      </div>
    </div>
  );
}

export default ChatArea;
