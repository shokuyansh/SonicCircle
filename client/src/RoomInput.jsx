import { useRef } from "react";
import { useState } from "react";

const RoomInput = ({onComplete})=>{
    const [room,setRoom] = useState(Array(6).fill(""));
    const inputRef = useRef([]);
    const handleChange = (event,index)=>{
        const value = event.target.value;
        const newRoom = [...room];
        newRoom[index] =value;
        setRoom(newRoom);
        if(value&&index<5){
            inputRef.current[index+1].focus();
        }
        if(newRoom.join("").length===6&&!newRoom.includes("")){
            onComplete(newRoom.join(""));
        }
    }
    const handleBackspace = (event,index)=>{
        if(event.key==="Backspace"&&index>0){
            const newRoom = [...room];
            newRoom[index] = "";
            newRoom[index-1] = "";
            setRoom(newRoom);
            inputRef.current[index-1].focus();
        }
    }
    const handlePaste = (event)=>{
        event.preventDefault();
        const pasteData = event.clipboardData.getData('text').trim().slice(0,6);
        const data = pasteData.split('');
        setRoom((prev)=>{
            const updated = [...prev];
            for(let i=0;i<data.length;i++){
                updated[i]=data[i];
                inputRef.current[i].value=data[i];
            }
            if(data.length<6){
                const nextIndex = data.length;
                inputRef.current[nextIndex].focus();
            }
            if(updated.join("").length===6&&!updated.includes("")){
                onComplete(updated.join(""));
            }
            return updated;
        })
    }
    return (
        <div className="pin-input-container">
            {room.map((dig,i)=>(
                <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={dig}
                    ref={(d) => (inputRef.current[i] =d)}
                    onChange={(e)=> handleChange(e,i)}
                    onKeyDown={(e)=> handleBackspace(e,i)}
                    onPaste={handlePaste}
                    className="pin-input-box"
                ></input>
            ))}

        </div>
    )
}
export default RoomInput;