"use client"

import { useState, useEffect } from "react"
import { socket } from "./Socket"
import Songs from "./Songs"
import "./App.css"
import RoomInput from "./RoomInput"
import RoomMember from "./roomMember"
import { toast, ToastContainer } from "react-toastify"
import axios from "axios"
import { FaCopy,FaCheck,FaGithub } from "react-icons/fa"
import {CiMail,CiLinkedin} from "react-icons/ci"
function App() {
  const [room, setRoom] = useState("")
  const [randomName, setRandomName] = useState("")
  const [showModal, setShowModal] = useState(true)
  const [selectedSong, setSelectedSong] = useState(null)
  const [songUploaded,setSongUploaded]=useState(false);
  const [isLoading,setLoading]=useState(false);
  const [isCopied,setisCopied]=useState(false);
  useEffect(() => {
    const handleRandomName = (name) => {
      setRandomName(name)
      localStorage.setItem("name", name)
      console.log("Random name received: " + name)
    }
    console.log("random_name hit")
    socket.on("random_name", handleRandomName)
    return () => {
      socket.off("random_name", handleRandomName)
    }
  }, [socket])

  useEffect(() => {
    console.log("Page refreshed")
    const storedRoom = localStorage.getItem("room")
    const storedName = localStorage.getItem("name")
    const navigationType = performance.getEntriesByType("navigation")[0].type
    const isReload = navigationType === "reload"
    console.log("navigation type : ", navigationType)
    console.log("stored room : " + storedRoom)
    console.log("stored Name : " + storedName)
    if (isReload === true) {
      if (storedName && storedRoom) {
        setRoom(storedRoom)
        setRandomName(storedName)
        socket.emit("join_room", { room: storedRoom }, (response) => {
          if (response.success === true) {
            console.log("Room Joined : " + storedRoom)
            socket.emit("room_state", { room: storedRoom })
            setShowModal(false)
          } else {
            toast(response.error)
          }
        })
      }
    } else {
      setShowModal(true)
    }
  }, [])

  const isTimeoutError = (error) => {
    return error.code === "ECONNABORTED" || error.message.includes("timeout") || error.message.includes("Network Error")
  }
  
  const uploadSong = async () => {
    if (!selectedSong) {
      console.error("No song selected for upload")
      toast("Select a song to upload")
      return
    }
    const formData = new FormData()
    formData.append("song", selectedSong)
    formData.append("room", room)
    try {
      setLoading(true);
      const response = await axios.post("https://musicmirrorbackend.onrender.com/api/upload", formData)
      if(response){
        setLoading(false);
      }
      console.log("Song uploaded :", response)
      setSongUploaded(true);
      toast("Song Uploaded,Refresh if changes not reflected")
    } catch (error) {
      console.error("Error uploading song: ", error)
      toast("Error Uploading Songs")
      if (isTimeoutError(error)) {
        setTimeout(() => (uploadSong(), 2000))
      }
    }
  }


  const createRoom = () => {
    try {
      console.log("Creating a new room")
      const newRoomId = Math.random().toString(36).substring(2, 8)
      setRoom(newRoomId)
      setShowModal(false)
      localStorage.setItem("room", newRoomId)
      localStorage.setItem("name", randomName)
      console.log("Creating a new room : ", newRoomId)
      socket.emit("create_room", { room: newRoomId })
      toast("Room Created")
    } catch (error) {
      console.error("Error creating room: ", error)
      toast("Error creating Room")
    }
  }

  const joinRoom = () => {
    try {
      if (room !== "") {
        socket.emit("join_room", { room }, (response) => {
          if (response.success === true) {
            console.log("Room Joined : " + room)
            socket.emit("room_state", { room })
            localStorage.setItem("room", room)
            localStorage.setItem("name", randomName)
            setShowModal(false)
            toast("Room Joined")
          } else {
            toast(response.error)
            setRoom("")
          }
        })
      } else {
        console.error("Room cannot be empty")
        toast("Room cannot be empty")
      }
    } catch (error) {
      console.error("Error joining room: ", error)
      toast.error("Error Joining Room")
    }
  }
  const handleCopy=async()=>{
      try{
        await navigator.clipboard.writeText(room);
        setisCopied(true);
        setTimeout(()=>{
          setisCopied(false);
        },2000)
      }catch(error){{
          console.error("Failed to copy : "+error);
          toast("Failed to copy , retry");
      }}
  }

  return (
    <div className="app-container">
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Welcome to Music Mirror</h2>
            <p>{randomName ? `You're joining as: ${randomName}` : "Generating your name..."}</p>
            <div style={{ marginTop: "1rem" }}>
              <button onClick={createRoom} className="modal-button">
                 Create Room
              </button>
              <div style={{ margin: "1rem 0" }}>
                <RoomInput
                  onComplete={(room) => {
                    setRoom(room)
                  }}
                ></RoomInput>
                <button onClick={joinRoom} className="modal-button">
                   Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {room && !showModal && (
        <div className="main-layout">
          <div className="left-column">
            <div className="upload-section-wrapper">
              <div className="upload-card">
                <div className="upload-header">
                  <div className="upload-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 10L12 5L17 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 5V15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3>Upload Music</h3>
                  <p>Add songs to your room</p>
                </div>
                <div className="upload-body">
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setSelectedSong(e.target.files[0])}
                      id="file-input"
                      className="file-input"
                    />
                    <label htmlFor="file-input" className="file-input-label">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 2V14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 12L12 3L21 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 17V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V17"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {selectedSong ? selectedSong.name : "Choose audio file"}
                    </label>
                  </div>
                  <div className="supported-formats">
                    <span>Supported: MP3, WAV, OGG</span>
                  </div>
                  <button className="upload-btn" onClick={uploadSong} disabled={!selectedSong||isLoading}>
                    {isLoading?(
                      <div style={{display:"flex",alignItems:"center"}}>
                        <div className="spinner"/>
                        Uploading...
                      </div>):(<>
                      
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 10L12 5L17 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 5V15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Upload Song
                    </>)}
                  </button>
                </div>
              </div>
            </div>
            <div className="room-info-card">
              <div className="room-id-label">Room</div>
              <div className="room-id-row">
                <span className="room-id-tag">{room}</span>
                <button className="copy-btn" onClick={handleCopy}>
                        {isCopied?<FaCheck/>:<FaCopy/>}
                        <span className="copy-text">
                        {isCopied?"Copied":"Copy"}</span>
                </button>
                </div>
                <p className="share-text">Share this ID with friends to sync up!</p>
            </div>
            <div className="room-info-card">
              <div className="note-text">
            <p>Note : If not working in sync , try to refresh </p>
            <p></p>
            <p>ps : May have some issues with mobile</p>
            <p>For any issues mail me ;)</p><br></br>
            </div>
            <div className="social-links">
              <a href="https://github.com/shokuyansh/SonicCircle"><FaGithub size={24}></FaGithub></a>
              <a href="mailto:anshmalgotra@gmail.com"><CiMail size={24}></CiMail></a>
              <a href="https://www.linkedin.com/in/ansh-malgotra-7b39b1274/"><CiLinkedin size={24}></CiLinkedin></a>
            </div>
            </div>
          </div>
          <div className="center-column">
            <Songs room={room} onSongUploaded={songUploaded} />
          </div>
          <div className="right-column">
            <RoomMember room={room} />
          </div>
        </div>
      )}
      <ToastContainer/>
    </div>
  )
}

export default App
