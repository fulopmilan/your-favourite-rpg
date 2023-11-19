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

        var roomLength = io.sockets.adapter.rooms.get(roomId)?.size ?? 0
        if (roomLength + 1 <= 4)
            socket.join(roomId);
        else
            //TODO: redirect this client with a message
            console.log("room is full")
    })
})

server.listen(process.env.PORT, () => {
    console.log("Server is listening on port " + process.env.PORT);
})