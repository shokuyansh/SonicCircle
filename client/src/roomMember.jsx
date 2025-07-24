import { useEffect,useState } from "react";
import { socket } from "./Socket";
const RoomMember =({room})=>{
    const [roomMembers, setRoomMembers] = useState([]);
    
    useEffect(()=>{
            console.log("Room member jsx hit!");
            socket.on('res_room_members',(data)=>{
            console.log(`Room members response received for room ${room}: ` + data);
            setRoomMembers(data);
            })
        
            return () => {
            socket.off('res_room_members');
            };
            
        },[room]);

       
    
    return (
    <div className="members-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
            <path
              d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.6977C21.7033 16.0414 20.9999 15.5759 20.2 15.3805"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 3.13C16.8003 3.32548 17.5037 3.79099 18.0098 4.44738C18.5159 5.10377 18.8004 5.91427 18.8004 6.75C18.8004 7.58573 18.5159 8.39623 18.0098 9.05262C17.5037 9.70901 16.8003 10.1745 16 10.37"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Room Members
        </h2>
        <span className="member-count">{roomMembers.length} online</span>
      </div>

      <div className="members-list">
        {roomMembers.map((member, index) => (
          <div key={index} className="member-item">
            <div className="member-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="member-info">
              <h4>{member}</h4>
            </div>
            <div className="member-status online"></div>
          </div>
        ))}
      </div>
    </div>

    )
}
export default RoomMember;