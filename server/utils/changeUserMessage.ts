import { Server as SocketIOServer, Socket } from "socket.io";
export const changeUserMessage = (socket: Socket, io: SocketIOServer, roomId: string) => {
    socket.on('changeUserMessage', (userMessage) => {
        io.to(roomId).emit("receiveUserMessage", userMessage, socket.id)
    })
}