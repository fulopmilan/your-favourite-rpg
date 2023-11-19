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
    const [userMessage, setUserMessage] = useState<string>("");

    //static
    const [storyText, setStoryText] = useState<string>("");
    //gets typed slowly by static
    const [storyDisplay, setStoryDisplay] = useState<string>("");

    //initialization
    useEffect(() => {
        const initialUsers = userIDs.map(userID => ({
            userID,
            userName: userID,
            message: "",
        }));
        setUsers(initialUsers);

        socket.emit('readyToContinue');
    }, [userIDs])


    //when storyText changes
    useEffect(() => {
        let counter = 0;

        const displayText = () => {
            if (counter < storyText.length) {
                setStoryDisplay((prevDisplay) => prevDisplay + storyText[counter - 1]);
                counter += 1;
                setTimeout(displayText, 50);
            }
            else {
                //it finished
            }
        };

        setStoryDisplay('');
        displayText();
    }, [storyText]);


    useEffect(() => {
        const receiveUserMessage = (userMessage: string, userID: string) => {
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

        const getStoryText = (newStoryText: string) => {
            console.log("XD")
            setStoryText(newStoryText)
        }

        socket.on('receiveUserMessage', receiveUserMessage);
        socket.on('getStoryText', getStoryText);
        return () => {
            socket.off('receiveUserMessage', receiveUserMessage);
            socket.off('getStoryText', getStoryText);
        }
    }, [users])


    const onChange = (v: React.FormEvent<HTMLInputElement>) => {
        setUserMessage(v.currentTarget.value);
        socket.emit("userMessageChange", v.currentTarget.value);
    }


    return (
        <div>
            <h1>Match</h1>
            {users.map(user => (
                <div>
                    {user.userID}:
                    {user.userID === socket.id ? (
                        <input
                            onChange={onChange}
                            value={userMessage}
                            type='text'
                            placeholder='your action'
                        />
                    ) : (
                        <span>{user.message}</span>
                    )}
                </div>
            ))}
            <p>Story</p>
            {storyDisplay}
        </div>
    )
}