import { socket } from './Socket';
import { use, useEffect,useRef,useState } from 'react';
import axios from 'axios';
const Songs = ({room}) =>{
    const audioRef = useRef(null);
    const [defaultSongs, setDefaultSongs] = useState([]);
    const [songs,setSongs] = useState([]);
    const [selectedSong,setSelectedSong] = useState(null);
    const [isPlaying,setIsPlaying] = useState(false);
    const isTimeoutError = (error)=>{
        return (
            error.code === 'ECONNABORTED'||
            error.message.includes('timeout') ||
            error.message.includes('Network Error')
        );
    };
    const fetchSongs = async()=>{
        try{
            if(room){
                const response = await axios.get(`http://localhost:3001/api/songs?room=${room}`);
                console.log("Fetched songs: ", response.data);
                setSongs(response.data.data);
                const defaultSongsResponse = await axios.get('http://localhost:3001/api/defaultsongs');
                console.log("Fetched default songs: ", defaultSongsResponse.data);
                setDefaultSongs(defaultSongsResponse.data.data);

            }
        }catch(error){
            console.error("Error fetching songs: ", error);
            if(isTimeoutError(error)){
                setTimeout(()=>(fetchSongs(),2000));
            }
        }
    }

    const uploadSong = async()=>{
        if(!selectedSong){
            console.error("No song selected for upload");
            return;
        }
        const formData = new FormData();
        formData.append('song',selectedSong);
        formData.append('room',room);
        try{
            const response = await axios.post('http://localhost:3001/api/upload',formData);
            console.log("Song uploaded :",response);
            fetchSongs();
        }catch(error){
            console.error("Error uploading song: ", error);
            if(isTimeoutError(error)){
                setTimeout(()=>(uploadSong(),2000));
            }
        }
    };
    useEffect(()=>{
        fetchSongs();
    },[room]);
    const sync=(songUrl)=>{
        console.log("Syncing song: " + songUrl);
        try {
            if(isPlaying){
                setIsPlaying(false);
                audioRef.current.pause();
                
                console.log("Paused song: "+songUrl);
                
            }
            if(audioRef.current.src === songUrl && isPlaying){
                 setIsPlaying(false);
                audioRef.current.pause();
                console.log("Paused song: "+songUrl);
                return;
            }
                setIsPlaying(true);
                audioRef.current.src=songUrl;
                audioRef.current.currentTime=0;
                audioRef.current.play();
                socket.emit('sync_music',{room,songUrl});
                console.log("Syncing song: " + songUrl);
                console.log("audio current src: "+ audioRef.current.src);
            
        }catch(error){
            console.error("Error syncing song: ", error);
        }
    }

    
    useEffect(()=>{
        const handlePlaySync = (song)=>{
            console.log("Now playing: " + song);
            audioRef.current.src=song;
            audioRef.current.currentTime=0;
            audioRef.current.play();
        }
        const handleRequestRoomState = (requesterId) =>{
            try{
                console.log("Requesting room state from: " + requesterId);
                if(room){
                    const song = audioRef.current?.src;
                    
                    socket.emit('respond_room_state', {
                    to:requesterId,
                    room:room,
                    currentSong:song,
                    currentTime: audioRef.current ? audioRef.current.currentTime : 0,
                    isPlaying : audioRef.current?!audioRef.current.paused:false,
                    lastUpdatedTime: Date.now()
                })}else{
                        console.error("Room does not exist");
                    }       
               }catch(err){
                    console.error(err);
               } 
            
        }
        const waitForAudioToLoad = (audio) =>{
            return new Promise((resolve,reject)=>{
                audio.onloadedmetadata = () => resolve();
                audio.onerror = () => reject(new Error("Audio failed to load"));
            })
        }
        const handleNewJoinerState = async(room_state)=>{
            console.log(`Setting up new joinee:${room_state.to}`);
            console.log("Room state: ", room_state);
           const  {currentSong,currentTime,isPlaying,lastUpdatedTime} = room_state;
           try{
                if(isPlaying){
                   
                    audioRef.current.src = currentSong;
                    await waitForAudioToLoad(audioRef.current);
                    const delay = (Date.now()-lastUpdatedTime)/1000;
                    audioRef.current.currentTime = currentTime + delay;
                    audioRef.current.play();
                }
           }catch(err){
                console.error("Error setting up new joiner state: ", err);
           } 
        }
        socket.on('playing_song',handlePlaySync);
        socket.on('request_room_state', handleRequestRoomState);
        socket.on('new_joiner_state',handleNewJoinerState)
        return () => {
        socket.off('playing_song',handlePlaySync);
        socket.off('request_room_state',handleRequestRoomState);
        socket.off('new_joiner_state',handleNewJoinerState);
    };
    },[room,socket])
    return(
        <>  
            <h1>Upload a Song</h1>
            <input type='file' accept='audio/*' onChange={(event)=>setSelectedSong(event.target.files[0])}></input>
            <button onClick={uploadSong}>Upload</button>
            <h2>Song List</h2>
            <ul>
                {defaultSongs.map((song,index)=>(
                    <li key={index}>
                        {song.public_id.split('/').pop()}
                        <button onClick={()=>sync(song.url)}>Play/Pause</button>
                    </li>
                ))}
                {songs.map((song,index)=>(
                    <li key={index}>
                        {song.public_id.split('/').pop()}
                        <button onClick={()=>sync(song.url)}>Play/Pause</button>
                    </li>
                ))}
            </ul>
            <audio ref={audioRef}></audio>
        </>
    )
}
export default Songs;