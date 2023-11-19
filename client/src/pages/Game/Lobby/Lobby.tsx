import { socket } from '../../../data/socket';

interface LobbyProps {
    userIDs: string[];
}

export const Lobby: React.FC<LobbyProps> = ({ userIDs }) => {
    const onStart = () => {
        socket.emit("startMatch");
    }

    return (
        <div>
            <h1>Lobby</h1>
            <button onClick={onStart}>Start</button>

            <h1>Players</h1>
            {userIDs.map((userID) => (
                <p>{userID}</p>
            ))}
        </div>
    )
}