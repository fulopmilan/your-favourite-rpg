//#region imports & requirements
import { Request, Response } from "express";
import { Socket } from "socket.io";

import { MessageData } from "./data/interfaces/MessageData";
import { RoomData } from "./data/interfaces/RoomData";

import { updateUserList } from "./utils/updateUserList";

import { startMatch } from "./utils/userActions/startMatch";
import { rename } from "./utils/userActions/rename";
import { disconnect } from "./utils/userActions/disconnect";
import { changeUserMessage } from "./utils/userActions/changeUserMessage";
import { readyToContinue } from "./utils/readyToContinue";

import path from 'path';

//DOTENV
require('dotenv').config();

const express = require('express');
const app = express();

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

//CORS
const cors = require('cors');

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
}));

app.use(express.static(path.join(__dirname, '/client/build')));

app.get('*', (req: Request, res: Response) => res.sendFile(path.join(__dirname, '/client/build/index.html')))

const io = new Server(server, {
    cors: {
        origin: process.env.ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Authorization", "Content-Type"],
    }
});
//#endregion

const roomData: { [roomId: string]: RoomData } = {};

//initial story writer prompt
//const prompt = "Navigate the tabletop RPG as the game master, maintaining immersion. Convey long-term data from the initial assistant, emphasizing story flow without allowing random player additions. Ensure realism in actions; magicians can perform magic, but others can't fly or teleport. Establish a challenging yet engaging storyline with concise updates. In the first message, disclose player money and items. Employ dialogue and name NPCs. Players can act post-message, and responses should complete or address their requests. Stay within 100 words per message. Player names will be provided.";
const prompt = "Embrace total creative freedom as you, the tabletop RPG game master. Players can explore any action, even unexpected or unrelated to the current storyline, including activities like slapping or murdering. Maintain character immersion, respond to player requests or actions post-message, and use the first assistant's long-term data to enrich the evolving narrative. Uphold realism in character abilities—magicians wield magic, while others adhere to plausible actions. Keep the storyline challenging, engaging, and within 100 words per message. Disclose player money and items in the first message. Name NPCs, utilize dialogue, and sustain the ongoing narrative, accommodating players' diverse choices and actions. Player names will be provided."

io.on("connection", (socket: Socket) => {
    socket.on('joinRoom', (roomId) => {
        let messageData: MessageData[] = [
            { role: "system", content: prompt }
        ];
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
        if ((playersInRoom + 1) <= 4 && !roomData[roomId].hasMatchStarted) {
            socket.join(roomId);

            //give player initial nickname
            socket.data.nickname = socket.id;
            updateUserList(io, roomId);
        }
        else {
            //TODO: redirect this client with a message
            console.log("Error joining the room for user " + socket.id)
        }
        //#endregion

        rename(socket, io, roomId)

        startMatch(socket, io, roomId, roomData[roomId]);

        readyToContinue(socket, io, roomData[roomId], messageData, roomId);

        changeUserMessage(socket, io, roomId);

        disconnect(socket, io, roomData[roomId], roomId)
    })
})

server.listen(process.env.PORT, () => {
    console.log("Server is listening on port " + process.env.PORT);
})