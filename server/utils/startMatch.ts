import { Server as SocketIOServer, Socket } from "socket.io";
import { RoomData } from "../data/interfaces/RoomData";

export const startMatch = (socket: Socket, io: SocketIOServer, roomId: string, roomData: RoomData) => {
    socket.on('startMatch', () => {
        io.to(roomId).emit("onStartMatch");

        roomData.hasMatchStarted = true;
    });
}