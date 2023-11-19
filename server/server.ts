import { Socket } from "socket.io";

const express = require('express');
const app = express();

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

//DOTENV
require('dotenv').config();

//CORS
const cors = require('cors');

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
}));

const io = new Server(server, {
    cors: {
        origin: process.env.ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type"],
    }
});

interface RoomData {
    hasMatchStarted: Boolean;
    readyPlayers: number;
}

const roomData: { [roomId: string]: RoomData } = {};
const storyText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam fermentum ligula urna, quis vulputate erat condimentum at. Praesent sed vehicula nunc. Maecenas bibendum nulla et feugiat tincidunt. Suspendisse potenti. Phasellus in velit ipsum. Donec eget lectus eu velit viverra fermentum in ac dui. Nulla gravida ultricies est eu consectetur.`;

io.on("connection", (socket: Socket) => {
    socket.on('joinRoom', (roomId) => {
        //console.log(socket.id + " joined to room " + roomId)

        //#region joining/creating server
        //create a room if it doesn't exist yet
        if (!roomData[roomId]) {
            roomData[roomId] = {
                hasMatchStarted: false,
                readyPlayers: 0
            };
        }

        //this returns Set
        let playersInRoom = io.sockets.adapter.rooms.get(roomId)?.size ?? 0

        //check user count and determine if the room is full 
        //check if the match has started yet
        if (playersInRoom + 1 <= 4 && !roomData[roomId].hasMatchStarted) {
            socket.join(roomId);

            const usersInRoomSet = io.sockets.adapter.rooms.get(roomId);

            // Check if usersInRoomSet is defined and is a Set
            if (usersInRoomSet instanceof Set) {
                const usersInRoom = Array.from(usersInRoomSet);
                io.to(roomId).emit("updateUserList", usersInRoom);
            } else {
                console.log("Room does not exist or is empty.");
            }
        }
        else {
            //TODO: redirect this client with a message
            console.log("Error joining the room for user " + socket.id)
        }
        //#endregion

        socket.on('startMatch', () => {
            io.to(roomId).emit("onStartMatch");

            roomData[roomId].hasMatchStarted = true;
        });

        socket.on('readyToContinue', () => {
            roomData[roomId].readyPlayers++;

            let playersInRoom = io.sockets.adapter.rooms.get(roomId)?.size;
            let readyPlayers = roomData[roomId].readyPlayers;

            if (readyPlayers >= playersInRoom) {
                io.to(roomId).emit("getStoryText", storyText);

                //reset the ready players for the next call
                roomData[roomId].readyPlayers = 0;
            }
        })

        socket.on('userMessageChange', (userMessage) => {
            io.to(roomId).emit("receiveMessage", userMessage, socket.id)
        })

        socket.on('disconnect', () => {
            //this returns Set
            const playersInRoomSet = io.sockets.adapter.rooms.get(roomId);

            //check if there are any players in the room (undefined means there are no players)
            if (playersInRoomSet?.size === undefined) {
                roomData[roomId].hasMatchStarted = false;
            }
            if (playersInRoomSet instanceof Set) {
                const usersInRoom = Array.from(playersInRoomSet);
                io.to(roomId).emit("updateUserList", usersInRoom);
            }
        })
    })
})

server.listen(process.env.PORT, () => {
    console.log("Server is listening on port " + process.env.PORT);
})