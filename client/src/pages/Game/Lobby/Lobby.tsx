import { useState } from 'react'
import { socket } from '../../../data/socket';

interface LobbyProps {
    userIDs: string[];
    nicknames: string[]
}

export const Lobby: React.FC<LobbyProps> = ({ userIDs, nicknames }) => {
    const [nickname, setNickname] = useState<string>();

    const onStart = () => {
        socket.emit("startMatch");
    }

    const onChange = (v: React.FormEvent<HTMLInputElement>) => {
        setNickname(v.currentTarget.value);
    }

    const onRename = () => {
        socket.emit("rename", nickname);
    }

    return (
        <div>
            <h1>Lobby</h1>
            <button onClick={onStart}>Start</button>

            <h1>Players</h1>
            {nicknames.map((nickname, index) => (
                <div>
                    <p>{nickname}</p>
                    {userIDs[index] === socket.id &&
                        <div>
                            <input onChange={onChange} type='text' placeholder='username' />
                            <button onClick={onRename}>submit</button>
                        </div>
                    }
                </div>
            ))}
        </div>
    )
}