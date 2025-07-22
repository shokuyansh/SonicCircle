const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const uploadRoute = require('./controller/routeUpload');
require('dotenv').config();
const { funnyNames } = require('./utils/names');
const cloudinary = require('./utils/cloudinary')
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use("/api",uploadRoute);

const socket_to_name = {};
const socket_to_room ={};
io.on('connection', (socket) => {
    const randomName = funnyNames[Math.floor(Math.random()*funnyNames.length)];
    socket_to_name[socket.id] = randomName;
    console.log("User Connected : " + socket.id);
    console.log("User name: "+randomName);
    socket.emit('random_name',randomName);
    socket.on('create_room',(data)=>{
        socket.join(data.room);
        console.log("User Joined Room : " + data.room);
        sendRoomMembers(data.room);
        socket_to_room[socket.id]=data.room;
    })
    socket.on('join_room', (data,callback) => {
        const validRoom=checkValidRoom(data.room);
        console.log("valid room : "+validRoom);
        if(validRoom===true){
            console.log("Joining room")
            socket.join(data.room);
            console.log("User Joined Room : " + data.room);
            sendRoomMembers(data.room);
            socket_to_room[socket.id]=data.room;    
            callback({success:true}); 
        }
        else{
            callback({success:false,error:"Room does not exist"});
        }
    });
    socket.on('sync_music', (data) =>{
        console.log("Syncing song: " + data.songUrl + " in room: " + data.room);
        socket.to(data.room).emit('playing_song',data.songUrl);
    })
    socket.on('room_state',(data)=>{
        const validRoom=checkValidRoom(data.room);
        console.log("valid room : "+validRoom);
        if(validRoom===true){
        console.log("Requesting room state for room: " + data.room);
        socket.to(data.room).emit('request_room_state',socket.id);
        }
    })
    socket.on('respond_room_state',(data)=>{
        console.log("Setting up new joinee: " + data.to + " in room: " + data.room);
        socket.to(data.to).emit('new_joiner_state',data);
    })
    socket.on('disconnect',async()=>{
        const room = socket_to_room[socket.id];
        if(!room){return;}
        delete socket_to_name[socket.id];
        delete socket_to_room[socket.id];

        const sockets_in_room = io.sockets.adapter.rooms.get(room);
        if(!sockets_in_room || sockets_in_room.size===0){
            try{
                const res = await cloudinary.api.delete_resources_by_prefix(`songs/${room}`);
                
                console.log(`Deleted resouces for room ${room} result:`+res.deleted);
                await new Promise((resolve)=>setTimeout(resolve,300000));
                await cloudinary.api.delete_folder(`songs/${room}`);
                console.log(`Deleted folder for room ${room}`);
            }catch(err){
                console.error(`Error deleting resources for room ${room}: `, err);
            }
        }
        else{
            sendRoomMembers(room);
        }
    })
});

function checkValidRoom(room){
    const socketsInRoom = io.sockets.adapter.rooms.get(room);
    if(!socketsInRoom)  {return false;}
    return true;
}

function sendRoomMembers(room) {
    console.log("Sending room members for room: " + room);
    const socketsInRoom = io.sockets.adapter.rooms.get(room);
    if(!socketsInRoom)  {return;}
    const memberNames = Array.from(socketsInRoom).map(socketID => socket_to_name[socketID]);
    console.log("Room members for room " + room + ": " + memberNames.join(', '));
    io.to(room).emit('res_room_members', memberNames);
}

const port = 3001;
server.listen(port , () =>{
    console.log("Server is running on port :",port);
})
