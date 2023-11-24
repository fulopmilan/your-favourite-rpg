import { Server as SocketIOServer, Socket } from "socket.io";
import { RoomData } from "../../data/interfaces/RoomData";
import { updateUserList } from "../updateUserList";

export const disconnect = (socket: Socket, io: SocketIOServer, roomData: RoomData, roomId: string) => {
    socket.on('disconnect', () => {
        const playersInRoomSet = io.sockets.adapter.rooms.get(roomId);

        //check if there are any players in the room (undefined means there are no players)
        if (playersInRoomSet?.size === undefined) {
            roomData.hasMatchStarted = false;
        }
        updateUserList(io, roomId);
    })
}