import { Server as SocketIOServer, Socket } from "socket.io";
import { RoomData } from "../data/interfaces/RoomData";
import { MessageData } from "../data/interfaces/MessageData";
import { callAi } from "./AI/callAi";
import { callSummarizingAi } from "./AI/callSummarizingAi";

//after (number) amount of messages are present in the prompt, 
//lets summarize the previous events so we'll save some tokens.
const messagesAfterSummary: number = 8;

export const readyToContinue = (socket: Socket, io: SocketIOServer, roomData: RoomData, messageData: MessageData[], roomId: string) => {
    socket.on('readyToContinue', (users?) => {
        roomData.readyPlayers++;

        const playersInRoom = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
        const readyPlayers = roomData.readyPlayers;

        const callLocalAi = () => {
            callAi(messageData, roomId, io)
        }

        if (readyPlayers >= playersInRoom) {

            if (users) {
                const userMessages: { nickName: string, message: string }[] = [];

                users.forEach((
                    user: {
                        userID: string;
                        nickname: string;
                        message: string;
                    }) => {

                    //the prompt was left empty
                    if (user.message === "")
                        user.message = "stand";

                    userMessages.push({ nickName: user.nickname, message: user.message });
                });

                let sortedUserMessage: string = "";

                userMessages.forEach(userMessage => {
                    sortedUserMessage += userMessage.nickName + ":" + userMessage.message + ",";
                });

                messageData.push({ role: "user", content: sortedUserMessage });

                //to prevent overloading tokens, we'll summarize every past message
                if (messageData.length >= messagesAfterSummary) {
                    callSummarizingAi(messageData, callLocalAi);
                    messageData.splice(1, 3);
                }
                else {
                    callLocalAi();
                }
            }
            else {
                //it must be the first round of the match
                const usersInRoomSet = io.sockets.adapter.rooms.get(roomId);
                if (usersInRoomSet instanceof Set) {
                    const usersInRoom = Array.from(usersInRoomSet);

                    const socketsWithData = usersInRoom
                        .map(socketId => io.sockets.sockets.get(socketId))
                        .filter(socket => socket && socket.data && socket.data.nickname) as Socket[];

                    const nicknamesInRoom = socketsWithData.map(socket => socket.data.nickname);

                    let nicknames: string = "names:";

                    nicknamesInRoom.forEach(nickname => {
                        nicknames += '"' + nickname + '"' + ",";
                    });

                    messageData.push({ role: "user", content: nicknames });
                    callAi(messageData, roomId, io)
                }
            }

            //reset for the next call
            roomData.readyPlayers = 0;
        }
    })
}