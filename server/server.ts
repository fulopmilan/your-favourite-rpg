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

io.on("connection", (socket: Socket) => {
    socket.on('joinRoom', (roomId) => {
        //console.log(socket.id + " joined to room " + roomId)

        let userLength = io.sockets.adapter.rooms.get(roomId)?.size ?? 0
        if (userLength + 1 <= 4) {
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
            console.log("room is full")
        }

        socket.on('startMatch', () => {
            io.to(roomId).emit("onStartMatch");
        });

        socket.on('disconnect', () => {
            const usersInRoomSet = io.sockets.adapter.rooms.get(roomId);
            if (usersInRoomSet instanceof Set) {
                const usersInRoom = Array.from(usersInRoomSet);
                io.to(roomId).emit("updateUserList", usersInRoom);
            }
        })

    })
})

server.listen(process.env.PORT, () => {
    console.log("Server is listening on port " + process.env.PORT);
})