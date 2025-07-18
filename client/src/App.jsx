import { use } from 'react';
import { useState,useEffect } from 'react'
import { socket } from './Socket';
import Songs from './Songs';
import RoomMember from './roomMember';
function App() {
  const [room, setRoom] = useState("")
  const [randomName, setRandomName] = useState("");
  const [showModal,setShowModal] = useState(false);
  useEffect(()=>{
    const handleRandomName = (name)=>{
      setRandomName(name);
      console.log("Random name received: " + name);
    }
    console.log("random_name hit");
    socket.on('random_name',handleRandomName);
    return ()=>{
      socket.off('random_name',handleRandomName); 
    }
  },[socket]);
  const createRoom = () =>{
    console.log("Creating a new room");
    const newRoomId = Math.random().toString(36).substring(2,12);
    setRoom(newRoomId);
    console.log("Creating a new room : ", newRoomId);
    socket.emit('join_room', {room:newRoomId});
  
  }
  
  const joinRoom = () =>{
    if(room!==""){
      socket.emit('join_room', {room});
      console.log("Room Joined : " + room);
      socket.emit('room_state',{room});
    }
    else{
      console.error("Room cannot be empty");
    }
  }
  

  return (
    <>
      <h1>Welcome to the Music Sync App</h1>
      <div>
        <button onClick={createRoom}>🎵 Create Room</button>
        <br />
        <input
          type="text"
          placeholder="Enter Room ID"
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={joinRoom}>🔗 Join Room</button>
        <p>{randomName? `You will be joining as: ${randomName}`: `Generating you name...`}</p>
      </div>

      {room && (
        <div>
          <h3>🆔 Current Room: <code>{room}</code></h3>
          <p>Share this ID with friends to sync up!</p>
        </div>
      )}
      <h2>Available Songs</h2>
      <p>Click on a song to start playing it in sync with others in the room.</p>
      <p>Make sure to join the same room as your friends to sync music.</p>
      <p>Enjoy the music!</p>
      <p>Note: The songs will only play if you are in the same room as your friends.</p>
      <p>Happy Listening!</p>
      
      <Songs room = {room}/>
      <RoomMember room={room} />
    </>
  )
}

export default App
