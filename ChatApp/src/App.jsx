import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './App.css';

function App({ socket }) {
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [room, setRoom] = useState('');
  const [rooms, setRooms] = useState([]);

  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Request initial data
    socket.emit('get_users');
    socket.emit('get_rooms', username);

    socket.emit('join_room', rooms.forEach(room => room.name));

    // Handle updates to user list
    socket.on('update_users', (userList) => {
      console.log('update_users', userList);
      setUsers(userList.map(user => user.username));
    });

    // Cleanup on unmount
    return () => {
      socket.off('message');
      socket.off('update_users');
    };
  }, [socket]);

  const handleUserClick = (user) => {
    setRecipient(user);
  };

  const handleRoomClick = (room) => {
    navigate(`/chat/${username}/room/${room}`);
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (room.trim()) {
      socket.emit('create_room', room);
      socket.emit('get_rooms', username);
      setRoom('');
    }
  };

  socket.on('update_roomList', (room) => {
    console.log('update_room', room);
    setRooms(room);
  });
  // Navigate to chat with the recipient if selected
  useEffect(() => {
    if (recipient) {
      navigate(`/chat/${username}/${recipient}`);
    }
  }, [recipient, navigate, username]);

  return (
    <div className="App">
      <h2>Chat App - {username}</h2>
      <div>
        <h3>Users:</h3>
        <div className='users'>
          {users.map((user, index) => (
            user !== username && (
              <div key={index} onClick={() => handleUserClick(user)}>
                {user}
              </div>
            )
          ))}
        </div>
      </div>

      {/* Rooms List */}
      <div className='rooms'>
        <h3>Rooms:</h3>
        <form id="form" onSubmit={handleRoomSubmit}>
          <input
            type="text"
            id="input"
            placeholder="Enter room name here..."
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>
        <div className='rooms'>
          {rooms.map((room, index) => (
            <div key={index} onClick={() => handleRoomClick(room)}>
              {room}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
