import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { socket } from '../../data/socket';

import { Lobby } from './Lobby/Lobby';
import { Match } from './Match/Match';

export const Game = () => {
    const { params } = useParams();
    useEffect(() => {
        socket.emit('joinRoom', params)
    }, [params])

    const [didMatchStart, setDidMatchStart] = useState<boolean>(false);
    const [userList, setUserList] = useState<string[]>(["", ""]);
    const [nicknameList, setNicknameList] = useState<string[]>(["", ""]);

    //receive data from server
    useEffect(() => {
        const startMatch = () => {
            setDidMatchStart(true);
        }
        const updateUserList = (usersInRoom: string[], nicknamesInRoom: string[]) => {
            setUserList(usersInRoom);
            setNicknameList(nicknamesInRoom);
        }

        socket.on("onStartMatch", startMatch)
        socket.on("updateUserList", updateUserList)

        return () => {
            socket.off("onStartMatch", startMatch);
            socket.off("updateUserList", updateUserList);
        }
    }, [userList, didMatchStart])

    return (
        <div>
            {didMatchStart ?
                <Match userIDs={userList} nicknames={nicknameList} />
                :
                <Lobby userIDs={userList} nicknames={nicknameList} />
            }
        </div>
    )
}