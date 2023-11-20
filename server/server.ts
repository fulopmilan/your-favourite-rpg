//#region imports & requirements
import { Socket } from "socket.io";

//DOTENV
require('dotenv').config();

//OpenAI
const OpenAIApi = require('openai');
const openai = new OpenAIApi({
    apiKey: process.env.OPENAI_API_KEY
});
//

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

interface RoomData {
    hasMatchStarted: Boolean;
    readyPlayers: number;
}
interface MessageData {
    role: string;
    content: string;
}

const roomData: { [roomId: string]: RoomData } = {};

async function callAi(messages: MessageData[], roomId: string) {
    console.log("called ai")
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-1106-preview", /*"gpt-3.5-turbo-1106",*/
            messages: messages,
        });

        const answer = completion.choices[0].message.content;
        if (answer !== "") {
            console.log(answer);
            io.to(roomId).emit("getStoryText", answer);
        }
    } catch (error: any) {
        console.error("Error calling OpenAI API:", error.message);
    }
}

io.on("connection", (socket: Socket) => {
    socket.on('joinRoom', (roomId) => {
        const messageData: MessageData[] = [
            { role: "system", content: "you're an rpg game master. you must cooperate with the players to make a fun and exciting story. players give you response for the continuation. the ending of your message should contain something that helps each player decide about the continuation of the story. write everything in a single paragraph and do not break the 4th wall. max 70 words. use english that noobs can also understand" }
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
                    callAi(messageData, roomId)
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
                        callAi(messageData, roomId)
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