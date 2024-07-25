import React, { useEffect, useState } from 'react';
import './App.css';
import ChatArea from './ChatArea';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function App({ socket }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const {username} = useParams();
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [room, setRoom] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for updates to the user list
    socket.emit('get_users');
    socket.on('update_users', (userList) => {
      setUsers(userList.map(user => user.username));
    });
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, { text: msg, type: 'received' }]);
    });
    // Cleanup on unmount
    return () => {
      socket.off('message');
      socket.off('update_users');
    };
  }, [socket]);

  const handleUserClick = (user) => {
    setRecipient(user);
}

if(recipient) {
  navigate(`/chat/${username}/${recipient}`);
};

const handleSubmit = (e) => {
  e.preventDefault();
  if (input.trim()) {
      socket.emit('message', input);
    setMessages((prevMessages) => [...prevMessages, { text: input, type: 'sent' }]);
    setInput('');
  }
};

const handleRoomSubmit = (e) => {
  e.preventDefault();
  if (room.trim()) {
      socket.emit('create_room', room);
    setRooms((prevRooms) => [...prevRooms, room]);
    setRoom('');
  }
};
  return (
    <div className="App">
      <h2>Chat App - {username}</h2>
      <div className='grpMsg'>
        To all:
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
      <div className='messages'>
        {messages.map((message, index) => (
          <div key={index} className={message.type}>
            {message.text}
          </div>
        ))}
        </div>
      </div>
      <div>
        <h3>Users:</h3>
        <div className='users'>
          {users.map((user, index) => (
            user !== username &&
            <div key={index} onClick={() => handleUserClick(user)}>{user}</div>
          ))}
        </div>
      </div>
     
     <div className='rooms'>
       <h3>Rooms:</h3>
       <form id="form" onSubmit={handleRoomSubmit}>
       <input type="text" id="input" placeholder="Enter room name here..." value={room} onChange={(e) => setRoom(e.target.value)}/>
       <button type="submit">Create</button>
       </form>
       <div className='rooms'>
         {rooms.map((room, index) => (
           <div key={index} onClick={() => handleRoomClick(room)}>{room}</div>
         ))}
       </div>
       </div>
    </div>
  );
}

export default App;
