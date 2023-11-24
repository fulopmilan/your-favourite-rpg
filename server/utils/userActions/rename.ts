import { Server as SocketIOServer, Socket } from "socket.io";
import { updateUserList } from "../updateUserList";

export const rename = (socket: Socket, io: SocketIOServer, roomId: string) => {
    socket.on('rename', (newName: string) => {
        socket.data.nickname = newName;
        updateUserList(io, roomId);
    })
}