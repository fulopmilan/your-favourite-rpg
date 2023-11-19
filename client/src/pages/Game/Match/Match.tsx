import { useEffect, useState, useRef } from 'react';
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

    //static for storing
    const [storyText, setStoryText] = useState<string>("");
    //typed for displaying
    const [storyDisplay, setStoryDisplay] = useState<string>("");

    //timer after the text finishes displaying
    const [timer, setTimer] = useState<number>(0);

    //#region initialization
    useEffect(() => {
        const initialUsers = userIDs.map(userID => ({
            userID,
            userName: userID,
            message: "",
        }));
        setUsers(initialUsers);

        socket.emit('readyToContinue');
    }, [userIDs])
    //#endregion

    //#region receiving server-side functions
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
            setStoryText(newStoryText)
        }

        socket.on('receiveUserMessage', receiveUserMessage);
        socket.on('getStoryText', getStoryText);
        return () => {
            socket.off('receiveUserMessage', receiveUserMessage);
            socket.off('getStoryText', getStoryText);
        }
    }, [users])
    //#endregion

    const usersRef = useRef(users);
    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    //#region after the text has finished displaying, this timer will start
    let counter = 0;
    const waitBeforeAction = () => {
        if (counter < 10) {
            setTimeout(() => {
                setTimer((prevTimer) => prevTimer + 1)
                counter++;
                waitBeforeAction();
            }, 1000)
        }
        else {
            counter = 0;
            socket.emit('readyToContinue', usersRef.current);
        }
    }
    //#endregion

    //#region when storyText changes
    useEffect(() => {
        let counter = 0;

        const displayText = () => {
            if (counter < storyText.length) {
                setStoryDisplay((prevDisplay) => prevDisplay + storyText[counter - 1]);
                counter += 1;
                setTimeout(displayText, 50);
            }
            else if (storyText.length !== 0) {
                waitBeforeAction();
            }
        };

        setStoryDisplay('');
        displayText();
    }, [storyText]);
    //#endregion

    const onChange = (v: React.FormEvent<HTMLInputElement>) => {
        setUserMessage(v.currentTarget.value);
        socket.emit("userMessageChange", v.currentTarget.value);
    }

    return (
        <div>
            {timer}
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