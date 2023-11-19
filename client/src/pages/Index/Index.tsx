import { useState } from "react"
import { useNavigate } from "react-router-dom"
export const Index = () => {

    const navigate = useNavigate();

    const onJoin = () => {
        const roomName = (Math.random() + 1).toString(36).substring(2);
        navigate("/room/" + roomName);
    }

    return (
        <div>
            <h1>Join a room</h1>
            <button onClick={onJoin}>Join</button>
        </div>
    )
}