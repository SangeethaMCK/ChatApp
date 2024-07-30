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
  
    // Join rooms once rooms data is fetched
    socket.on('update_roomList', (roomList) => {
      setRooms(roomList);
      roomList.forEach(room => {
        socket.emit('join_room', room);
      });
    });
  
    // Handle updates to user list
    socket.on('update_users', (userList) => {
      console.log('update_users', userList);
      setUsers(userList.map(user => ({
        username: user.username,
        connection: user.connection
      })));
    });
  
    // Cleanup on unmount
    return () => {
      socket.off('update_users');
      socket.off('update_roomList');
    };
  }, [socket, username]);
  

  const handleUserClick = (user) => {
    setRecipient(user);
  };

  const handleRoomClick = (room) => {
    navigate(`/chat/${username}/room/${room}`);
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (room.trim()) {
      socket.emit('create_room', room, username);
      socket.emit('get_rooms', username);
      setRoom('');
    }
  };

  socket.on('update_roomList', (roomList) => {
    console.log('update_room', roomList);
    setRooms(roomList);
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
            user.username !== username && (
              <div 
                key={index} 
                onClick={() => handleUserClick(user.username)}
                className='userName'
                style={{
                  color: user.connection ? 'green' : 'red'}}
              >
                {user.username}
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
            <div 
              key={index} 
              onClick={() => handleRoomClick(room)}
              className='roomName'
            >
              {room}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
