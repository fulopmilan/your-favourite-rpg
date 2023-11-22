import { Server as SocketIOServer, Socket } from "socket.io";

export const updateUserList = (io: SocketIOServer, roomId: string) => {
    const usersInRoomSet = io.sockets.adapter.rooms.get(roomId);

    if (usersInRoomSet instanceof Set) {
        const usersInRoom = Array.from(usersInRoomSet);

        const socketsWithData = usersInRoom
            .map(socketId => io.sockets.sockets.get(socketId))
            .filter(socket => socket && socket.data && socket.data.nickname) as Socket[];

        const nicknamesInRoom = socketsWithData.map(socket => socket.data.nickname);

        io.to(roomId).emit("updateUserList", usersInRoom, nicknamesInRoom);
    }
};
