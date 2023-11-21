import { useEffect, useState, useRef } from 'react';
import { socket } from '../../../data/socket';
import './Match.css';

interface MatchProps {
    userIDs: string[];
    nicknames: string[]
}
interface UserProp {
    userID: string;
    nickname: string;
    message: string;
}

export const Match: React.FC<MatchProps> = ({ userIDs, nicknames }) => {

    const [users, setUsers] = useState<UserProp[]>([]);
    const [userMessage, setUserMessage] = useState<string>("");

    //static for storing
    const [storyText, setStoryText] = useState<string>("");
    //typed for displaying
    const [storyDisplay, setStoryDisplay] = useState<string>("");

    //timer after the text finishes displaying
    const [timer, setTimer] = useState<number>(30);

    const usersRef = useRef(users);
    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    //#region initialization
    useEffect(() => {
        const initialUsers = userIDs.map((userID, index) => ({
            userID,
            nickname: nicknames[index],
            message: "",
        }));
        setUsers(initialUsers);

        socket.emit('readyToContinue');
    }, [])
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

    //#region after the text has finished displaying, this timer will start
    let counter = 30;
    const waitBeforeAction = () => {
        if (counter > 0) {
            setTimeout(() => {
                setTimer((prevTimer) => prevTimer - 1)
                counter--;
                waitBeforeAction();
            }, 1000)
        }
        else {
            counter = 30;
            setTimer(30);

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
                setTimeout(displayText, 35);
            }
            else if (storyText.length !== 0) {
                counter = 0;
                waitBeforeAction();
            }
        };

        setStoryDisplay('');
        displayText();

        //on new text, reset the messages
        setUserMessage('');
        users.forEach(user => {
            user.message = "";
        })
    }, [storyText]);
    //#endregion

    const onChange = (v: React.FormEvent<HTMLTextAreaElement>) => {
        setUserMessage(v.currentTarget.value);
        socket.emit("userMessageChange", v.currentTarget.value);
    }

    return (
        <div>
            <div id='storytext-container'>
                <p id='storytext'>{storyDisplay}</p>
            </div>
            <div className='user-bubble-container'>
                {users.map(user => (
                    <div>
                        <p className='user-bubble-player-name'>{user.nickname}</p>
                        <div className='user-bubble'>
                            {user.userID === socket.id ? (
                                <textarea
                                    onChange={onChange}
                                    value={userMessage}
                                    placeholder='your action'
                                    autoFocus={true}
                                    onBlur={({ target }) => target.focus()}
                                />
                            ) : (
                                <p>{user.message}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <p id='timer'>{timer}</p>
        </div>
    )
}