import { useEffect,useState } from "react";
import { socket } from "./Socket";
const RoomMember =({room})=>{
    const [roomMembers, setRoomMembers] = useState([]);
    
    useEffect(()=>{
        
        socket.on('res_room_members',(data)=>{
            console.log(`Room members response received for room ${room}: ` + data);
            setRoomMembers(data);
            
        });

        return () => {
            socket.off('res_room_members');
        };
    },[]);
    return (
        <>
            <h2>Room Members:</h2>
            <ul>{roomMembers.map((members,index) =>(
                <li key={index}>{members}</li>
                ))}</ul>
        </>
    )
}
export default RoomMember;