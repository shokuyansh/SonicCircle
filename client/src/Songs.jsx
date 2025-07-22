"use client"
import { socket } from "./Socket"
import { useEffect, useRef, useState } from "react"
import axios from "axios"
import "./Songs.css"

const Songs = ({ room, onSongUploaded }) => {
  const audioRef = useRef(null)
  const [defaultSongs, setDefaultSongs] = useState([])
  const [songs, setSongs] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)

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
      audioRef.current.play()
      socket.emit("sync_music", { room, songUrl })
      console.log("Syncing song: " + songUrl)
    } catch (error) {
      console.error("Error syncing song: ", error)
    }
  }

  useEffect(() => {
    const handlePlaySync = (song) => {
      console.log("Now playing: " + song)
      audioRef.current.src = song
      audioRef.current.currentTime = 0
      audioRef.current.play()
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
            <span className="song-count">{defaultSongs.length + songs.length} songs</span>
          </div>
          <div className="songs-list">
            {defaultSongs.map((song, index) => (
              <div key={`default-${index}`} className="song-item">
                <div className="song-info">
                  <div className="song-artwork">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  </div>
                  <div className="song-details">
                    <h4>{song.public_id.split("/").pop()}</h4>
                  </div>
                </div>
                <button className="play-btn" onClick={() => sync(song.url)} title="Play/Pause">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5,3 19,12 5,21" fill="currentColor" />
                  </svg>
                </button>
              </div>
            ))}
            {songs.map((song, index) => (
              <div key={`uploaded-${index}`} className="song-item">
                <div className="song-info">
                  <div className="song-artwork">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  </div>
                  <div className="song-details">
                    <h4>{song.public_id.split("/").pop()}</h4>
                  </div>
                </div>
                <button
                  className="play-btn"
                  onClick={() => sync(song.url)}
                  title="Play/Pause"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5,3 19,12 5,21" fill="currentColor" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <audio ref={audioRef}></audio>
    </>
  )
}

export default Songs
