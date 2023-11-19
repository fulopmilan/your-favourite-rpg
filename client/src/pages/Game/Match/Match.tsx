import { useEffect, useState } from 'react';
import { socket } from '../../../data/socket';

interface MatchProps {
    userIDs: string[];
}
interface UserProp {
    userID: string;
    userName: string;
    message: string;
}

export const Match: React.FC<MatchProps> = ({ userIDs }) => {

    const [users, setUsers] = useState<UserProp[]>([]);

    //initialize the users array
    useEffect(() => {
        const initialUsers = userIDs.map(userID => ({
            userID,
            userName: userID,
            message: "",
        }));
        setUsers(initialUsers);

    }, [userIDs])

    const [userMessage, setUserMessage] = useState<string>("");

    useEffect(() => {
        const receiveMessage = (userMessage: string, userID: string) => {
            setUsers(prevUsers => {
                const updatedUsers = prevUsers.map(user => {
                    if (user.userID === userID) {
                        return { ...user, message: userMessage };
                    }
                    return user;
                });
                return updatedUsers;
            });
        }
        socket.on('receiveMessage', receiveMessage);
        return () => {
            socket.off('receiveMessage', receiveMessage);
        }
    }, [users])

    const onChange = (v: React.FormEvent<HTMLInputElement>) => {
        setUserMessage(v.currentTarget.value);
        socket.emit("userMessageChange", v.currentTarget.value);
    }

    return (
        <div>
            <h1>Match</h1>
            <input onChange={onChange} value={userMessage} type='text' />

            {users.map(user => (
                <div>
                    {user.userID}: {user.message}
                </div>
            ))}
        </div>
    )
}