import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Existing({ socket }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleExistingUser = (username, recipient) => {
      socket.emit("get_rooms");
      socket.emit("get_users");

      const handleRoomList = (rooms) => {
        if (rooms.some((r) => r.name === recipient)) {
          navigate(`/chat/${username}/room/${recipient}`);
        }
      };

      const handleUserList = (users) => {
        const recipientUser = users.find((u) => u.username === recipient);
        
        if (recipient) {
          if (recipientUser) {
            if (username === recipient) {
              alert("You cannot chat with yourself");
              navigate("/");
              return;
            }
            navigate(`/chat/${username}/${recipient}`);
          } else {
            socket.emit("get_rooms");
          }
        } else if (username) {
          navigate(`/chat/${username}`);
        } else {
          alert("Unauthorized");
          navigate("/");
        }
      };

      socket.on("update_roomList", handleRoomList);
      socket.on("update_users", handleUserList);
    };

    socket.on("login_existUser", handleExistingUser);

    return () => {
      socket.off("login_existUser", handleExistingUser);
      socket.off("update_roomList");
      socket.off("update_users");
    };
  }, [navigate, socket]);

  return null; // No UI to render
}

export default Existing;
