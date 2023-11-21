//#region imports & requirements
import { Socket } from "socket.io";
import { callAi } from "./utils/callAi";

import { MessageData } from "./data/interfaces/MessageData";
import { RoomData } from "./data/interfaces/RoomData";

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

io.on("connection", (socket: Socket) => {
    socket.on('joinRoom', (roomId) => {
        let messageData: MessageData[] = [
            { role: "system", content: "you're a tabletop rpg game master. act like a human. do not break character. do not let players make up random scenes, characters or objects, that aren't in the story. the player can do pretty much everything thats realistic, including magic if they are magicians, or randomly dancing, singing etc... however if they aren't magicians, they shouldn't be able to fly or teleport for example. every player can act after your message, and you must complete their request in message, or atleast react to it. do not start a new storyline after your first message, always continue the current one. i'll provide you the player names. max 100 words per message." }
        ];
        //console.log(socket.id + " joined to room " + roomId)

        const updateUserList = () => {
            const usersInRoomSet = io.sockets.adapter.rooms.get(roomId);

            //check if usersInRoomSet is defined and is a Set
            if (usersInRoomSet instanceof Set) {

                const usersInRoom = Array.from(usersInRoomSet);
                const nicknamesInRoom = usersInRoom.map(socketId => io.sockets.sockets.get(socketId).data.nickname);

                io.to(roomId).emit("updateUserList", usersInRoom, nicknamesInRoom);
            }
        }

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
            updateUserList();
        }
        else {
            //TODO: redirect this client with a message
            console.log("Error joining the room for user " + socket.id)
        }
        //#endregion

        socket.on('rename', (newName: string) => {
            socket.data.nickname = newName;
            updateUserList();
        })

        socket.on('startMatch', () => {
            io.to(roomId).emit("onStartMatch");

            roomData[roomId].hasMatchStarted = true;
        });

        socket.on('readyToContinue', (users?) => {
            roomData[roomId].readyPlayers++;

            let playersInRoom = io.sockets.adapter.rooms.get(roomId)?.size;
            let readyPlayers = roomData[roomId].readyPlayers;

            if (readyPlayers >= playersInRoom) {

                if (users) {
                    let userMessages: { userName: string, message: string }[] = [];

                    users.forEach((
                        user: {
                            userID: string;
                            nickname: string;
                            message: string;
                        }) => {

                        userMessages.push({ userName: user.nickname, message: user.message });
                    });

                    let sortedUserMessage: string = "";

                    userMessages.forEach(userMessage => {
                        sortedUserMessage += userMessage.userName + ":" + userMessage.message + ",";
                    });

                    messageData.push({ role: "user", content: sortedUserMessage });

                    if (messageData.length > 5) {
                        messageData.splice(1, 1);
                    }
                    console.log(messageData);

                    callAi(messageData, roomId, io)
                }
                else {
                    //very first round of the match

                    //get every nickname in the room
                    const usersInRoomSet = io.sockets.adapter.rooms.get(roomId);
                    if (usersInRoomSet instanceof Set) {
                        const usersInRoom = Array.from(usersInRoomSet);
                        const nicknamesInRoom = usersInRoom.map(socketId => io.sockets.sockets.get(socketId).data.nickname);
                        let nicknames: string = "names:";

                        nicknamesInRoom.forEach(nickname => {
                            nicknames += '"' + nickname + '"' + ",";
                        });

                        messageData.push({ role: "user", content: nicknames });
                        callAi(messageData, roomId, io)
                    }
                }

                //reset for the next call
                readyPlayers = 0;
                roomData[roomId].readyPlayers = 0;
            }
        })

        socket.on('userMessageChange', (userMessage) => {
            io.to(roomId).emit("receiveUserMessage", userMessage, socket.id)
        })

        socket.on('disconnect', () => {
            //this returns Set
            const playersInRoomSet = io.sockets.adapter.rooms.get(roomId);

            //check if there are any players in the room (undefined means there are no players)
            if (playersInRoomSet?.size === undefined) {
                roomData[roomId].hasMatchStarted = false;
            }
            updateUserList();
        })
    })
})

server.listen(process.env.PORT, () => {
    console.log("Server is listening on port " + process.env.PORT);
})