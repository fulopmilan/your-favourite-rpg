//#region imports & requirements
import { Socket } from "socket.io";
import { callAi } from "./utils/callAi";

import { MessageData } from "./data/interfaces/MessageData";
import { RoomData } from "./data/interfaces/RoomData";

import { updateUserList } from "./utils/updateUserList";

import { startMatch } from "./utils/startMatch";
import { rename } from "./utils/rename";
import { disconnect } from "./utils/disconnect";
import { changeUserMessage } from "./utils/changeUserMessage";
import { readyToContinue } from "./utils/readyToContinue";

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
const prompt = "you're a tabletop rpg game master. do not break character. write everything in one line, do not make lists. focus on the story all the time do not let players make up random scenes, characters or objects, that aren't in the story. the first message stores every long-term data, use that as much as u can. however do not give the players random items that come in handy if they do not have it already in their inventory (first message). the player can do pretty much everything thats realistic, including magic if they are magicians, they can even start randomly dancing, singing etc... however if they aren't magicians, they shouldn't be able to fly or teleport for example. make sure the storyline is somewhat challenging and not too simple. in your first message, tell players how much money and what random items they have. use a lot of dialogues. give a name to every NPC. every player can act after your message, and you must complete their request in message, or atleast react to it. do not start a new storyline after your first message, always continue the current one. i'll provide you the player name(s). IMPORTANT: use up to 100 words per your message.";

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