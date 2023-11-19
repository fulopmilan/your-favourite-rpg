import { socket } from '../../../data/socket';

interface LobbyProps {
    users: string[];
}

export const Lobby: React.FC<LobbyProps> = ({ users }) => {
    const onStart = () => {
        socket.emit("startMatch");
    }

    return (
        <div>
            <h1>Lobby</h1>
            <button onClick={onStart}>Start</button>

            <h1>Players</h1>
            {users.map((user) => (
                <p>{user}</p>
            ))}
        </div>
    )
}