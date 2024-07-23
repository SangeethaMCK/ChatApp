import React, { useEffect, useState } from 'react';
import './App.css';
import ChatArea from './ChatArea';

function App({ username, socket }) {
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);

  useEffect(() => {
    // Listen for updates to the user list
    socket.on('update_users', (userList) => {
      setUsers(userList.map(user => user.username));
    });

    // Cleanup on unmount
    return () => {
      socket.off('update_users');
    };
  }, [socket]);

  const handleUserClick = (user) => {
    setRecipient(user);
}

if(recipient) {
  return <ChatArea
       username={username}
       socket={socket}
       recipient={recipient}
     />
};

  return (
    <div className="App">
      <h2>Chat App - {username}</h2>
      <div>
        <h3>Users:</h3>
        <div className='users'>
          {users.map((user, index) => (
            user !== username &&
            <div key={index} onClick={() => handleUserClick(user)}>{user}</div>
          ))}
        </div>
      </div>
     
    </div>
  );
}

export default App;
