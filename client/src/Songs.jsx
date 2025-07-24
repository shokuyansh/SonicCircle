import { socket } from "./Socket"
import { useEffect, useRef, useState } from "react"
import axios from "axios"
import "./Songs.css"
import { FaPlay } from "react-icons/fa";


const Songs = ({ room, onSongUploaded }) => {
  const audioRef = useRef(null)
  const [defaultSongs, setDefaultSongs] = useState([])
  const [songs, setSongs] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoveredIndex,setHoveredIndex]=useState("")
  const [currentTime,setCurrentTime]=useState(null);
  const [isHoveringSeek,setHoveringSeek]=useState(false); 
  const allsongs=[...defaultSongs,...songs];
  const isTimeoutError = (error) => {
    return error.code === "ECONNABORTED" || error.message.includes("timeout") || error.message.includes("Network Error")
  }

  const fetchSongs = async () => {
    try {
      if (room) {
        const response = await axios.get(`https://musicmirrorbackend.onrender.com/api/songs?room=${room}`)
        console.log("Fetched songs: ", response.data)
        setSongs(response.data.data)
        const defaultSongsResponse = await axios.get("https://musicmirrorbackend.onrender.com/api/defaultsongs")
        console.log("Fetched default songs: ", defaultSongsResponse.data)
        setDefaultSongs(defaultSongsResponse.data.data)
      }
    } catch (error) {
      console.error("Error fetching songs: ", error)
      if (isTimeoutError(error)) {
        setTimeout(() => (fetchSongs(), 2000))
      }
    }
  }

  useEffect(() => {
    if (onSongUploaded) {
      fetchSongs()
    }
  }, [onSongUploaded])

  useEffect(() => {
    fetchSongs()
  }, [room])

  const sync = (songUrl) => {
    console.log("Syncing song: " + songUrl)
    try {
      if (isPlaying) {
        setIsPlaying(false)
        audioRef.current.pause()
        console.log("Paused song: " + songUrl)
      }
      if (audioRef.current.src === songUrl && isPlaying) {
        setIsPlaying(false)
        audioRef.current.pause()
        console.log("Paused song: " + songUrl)
        return
      }
      setIsPlaying(true)
      audioRef.current.src = songUrl
      audioRef.current.currentTime = 0
      socket.emit("sync_music", { 
        room, 
        songUrl,
        songCurrentTime:audioRef.current.currentTime,
        isPlaying:!audioRef.current.paused,
        timestamp:Date.now()
       });
      audioRef.current.play()
      console.log("Syncing song: " + songUrl)
    } catch (error) {
      console.error("Error syncing song: ", error)
    }
  }

  useEffect(() => {
    const handlePlaySync =async(data) => {
      console.log("Now playing: " + data.songUrl)
      await waitForAudioToLoad(audioRef.current)
      audioRef.current.src = data.songUrl
      const delay=(Date.now()-timestamp)/1000;
      audioRef.current.currentTime = data.songCurrentTime+delay;
      audioRef.current.play()
      setIsPlaying(true);
    }

    const handleRequestRoomState = (requesterId) => {
      try {
        console.log("Requesting room state from: " + requesterId)
        if (room) {
          const song = audioRef.current?.src
          socket.emit("respond_room_state", {
            to: requesterId,
            room: room,
            currentSong: song,
            currentTime: audioRef.current ? audioRef.current.currentTime : 0,
            isPlaying: audioRef.current ? !audioRef.current.paused : false,
            lastUpdatedTime: Date.now(),
          })
        } else {
          console.error("Room does not exist")
        }
      } catch (err) {
        console.error(err)
      }
    }

    const waitForAudioToLoad = (audio) => {
      return new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => resolve()
        audio.onerror = () => reject(new Error("Audio failed to load"))
      })
    }

    const handleNewJoinerState = async (room_state) => {
      console.log(`Setting up new joinee:${room_state.to}`)
      console.log("Room state: ", room_state)
      const { currentSong, currentTime, isPlaying, lastUpdatedTime } = room_state
      try {
        if (isPlaying) {
          audioRef.current.src = currentSong
          await waitForAudioToLoad(audioRef.current)
          const delay = (Date.now() - lastUpdatedTime) / 1000
          audioRef.current.currentTime = currentTime + delay
          audioRef.current.play()
        }
      } catch (err) {
        console.error("Error setting up new joiner state: ", err)
      }
    }

    socket.on("playing_song", handlePlaySync)
    socket.on("request_room_state", handleRequestRoomState)
    socket.on("new_joiner_state", handleNewJoinerState)

    return () => {
      socket.off("playing_song", handlePlaySync)
      socket.off("request_room_state", handleRequestRoomState)
      socket.off("new_joiner_state", handleNewJoinerState)
    }
  }, [room, socket])

  const songmap=new Map();
  allsongs.map((song,index)=>(
    songmap.set(song.url,index)
  ))
  const handlePrev=()=>{
    try{
      setIsPlaying(false);
      const currentSong=audioRef.current.src;
      const currentIndex=songmap.get(currentSong);
      const newIndex=(currentIndex-1+allsongs.length)%allsongs.length;
      const newSong=allsongs[newIndex]
      if(!newSong){
        console.warn("no prev songs")
      }
      console.log("New song : "+newSong.url);
      audioRef.current.src=newSong.url;
      sync(newSong.url);
    }catch(error){
        toast(error);
    }
  }
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }
  const handleNext=()=>{
      try{
      setIsPlaying(false);
      const currentSong=audioRef.current.src;
      const currentIndex=songmap.get(currentSong);
      const newIndex=(currentIndex+1+allsongs.length)%allsongs.length;
      const newSong=allsongs[newIndex];
      if(!newSong){
        console.warn("no new songs")
      }
      console.log("New song : "+newSong.url);
      audioRef.current.src=newSong.url;
      sync(newSong.url);
    }catch(error){
        toast(error);
    }
  }
  
const formatTime = (secs) => {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const handleSeek=(e)=>{
  const seek=parseFloat(e.target.value);
  audioRef.current.currentTime=seek;
}
useEffect(() => {
  const interval = setInterval(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, 100);
  return () => clearInterval(interval);
}, []);

  return (
    <>
      <div className="songs-container">
        <div className="songs-section">
          <div className="section-header">
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 18V5L21 3V16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
              Playlist
            </h2>
            <span className="song-count">{allsongs.length} songs</span>
          </div>
          <div className="songs-list">
            {allsongs.map((song, index) => (
              <div  
                key={`song-${index}`} 
                className={`song-item ${audioRef.current.src === song.url ? "active" : ""}`}
                onClick={()=>sync(song.url)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}>
              <div className="song-index">
                {audioRef.current.src === song.url && isPlaying ? (
                <span className="bars">
                <span></span><span></span><span></span>
                </span>
                ) : hoveredIndex === index ? (
                <FaPlay />
                ) : (
                index + 1
                )}
              </div>
              <div className="song-title">{song.public_id.split("/").pop()}</div>
              
            </div>

            ))}
          </div>
        </div>
      </div>
      <div className="playbar">
          <div className="button-group">
          <button onClick={handlePrev} title="Previous">
              ⏮
          </button>
          <button className="play-button" onClick={togglePlayPause} title="Play/Pause">
              {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={handleNext} title="Next">
               ⏭
          </button>
          </div>
          <div className="seek-bar-wrapper">
          <input
              type="range"
              min="0"
              max={audioRef.current?.duration || 0}
              value={currentTime}
              onChange={handleSeek}  
              onMouseEnter={()=>setHoveringSeek(true)}
              onMouseLeave={()=>setHoveringSeek(false)}
              className={`seek-bar ${isHoveringSeek?`hovered`:''}`}
              style={{
                background: `linear-gradient(to right, #37aa5f ${Math.floor((currentTime / (audioRef.current?.duration || 1)) * 100)}%, #555 ${Math.floor((currentTime / (audioRef.current?.duration || 1)) * 100)}%)`
  }}/>
          
          <div className="time-display">
              {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(audioRef.current?.duration || 0)}
          </div>
          </div>
      </div>

      <audio ref={audioRef}></audio>
    </>
  )
}

export default Songs
