import { useState,useEffect } from 'react'
import { socket } from './Socket';
import Songs from './Songs';
import RoomMember from './roomMember';
import './App.css';
import RoomInput from './RoomInput';
function App() {
  const [room, setRoom] = useState("")
  const [randomName, setRandomName] = useState("");
  const [showModal,setShowModal] = useState(true);
  useEffect(()=>{
    const handleRandomName = (name)=>{
      setRandomName(name);
      localStorage.setItem('name',name);
      console.log("Random name received: " + name);
    }
    console.log("random_name hit");
    socket.on('random_name',handleRandomName);
    return ()=>{
      socket.off('random_name',handleRandomName); 
    }
  },[socket]);

  useEffect(()=>{
    console.log("Page refreshed")
    const storedRoom = localStorage.getItem('room');
    const storedName = localStorage.getItem('name');
    const navigationType = performance.getEntriesByType("navigation")[0].type;
    const isReload = navigationType==="reload";
    console.log("navigation type : ",navigationType);
    console.log("stored room : "+storedRoom);
    console.log("stored Name : "+storedName);
    if(isReload===true){
      if(storedName&&storedRoom){
        setRoom(storedRoom);
        setRandomName(storedName);
        socket.emit('join_room',{room},(response)=>{
            if(response.success===true){
              console.log("Room Joined : " + room);
              socket.emit('room_state',{room:storedRoom});
              setShowModal(false);
            }
            else{
              alert(response.error);
              setRoom("");
          }
        })
    }
  }
  else{
      setShowModal(true);
    }
    
  },[])

  useEffect(()=>{
      const clearSession=()=>{
          sessionStorage.removeItem('hasVisited');
      }
      window.addEventListener('beforeunload',clearSession);
      return ()=>window.removeEventListener('beforeunload',clearSession);   
  },[])
  
  const createRoom = () =>{
    try{
      console.log("Creating a new room");
      const newRoomId = Math.random().toString(36).substring(2,8);
      setRoom(newRoomId);
      setShowModal(false);
      localStorage.setItem('room',newRoomId);
      localStorage.setItem('name',randomName);
      console.log("Creating a new room : ", newRoomId);
      socket.emit('create_room', {room:newRoomId});
    }catch(error){
      console.error("Error creating room: ",error);
    }
  }
  
  const joinRoom = () =>{
    try{
        if(room!==""){
          socket.emit('join_room',{room},(response)=>{
            if(response.success===true){
              console.log("Room Joined : " + room);
              socket.emit('room_state',{room});
              localStorage.setItem('room', room);
              localStorage.setItem('name',randomName);
              setShowModal(false);
            }
            else{
              alert(response.error);
              setRoom("");
          }
          });   
      }
      else{
        console.error("Room cannot be empty");
      }
    }catch(error){
      console.error("Error joining room: ",error);
    }
    
  }
  

  return (
    <>
      {showModal && (
      <div className="modal-overlay">
        <div className="modal-box">
          <h2>Welcome to Music Sync App 🎶</h2>
            <p>{randomName ? `You're joining as: ${randomName}` : 'Generating your name...'}</p>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={createRoom} className="modal-button">
              🎵 Create Room
               </button>
        <div style={{ margin: '1rem 0' }}>
          <RoomInput onComplete={(room)=>{
              setRoom(room);
              
          }}></RoomInput>
            <button onClick={joinRoom} className="modal-button">
              🎵 Join Room
               </button>
              </div>
            </div>
         </div>
      </div>)}

      
      {room &&!showModal && (
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
