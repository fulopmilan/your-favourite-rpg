import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { socket } from '../../data/socket';

export const Game = () => {
    const { params } = useParams();
    useEffect(() => {
        socket.emit('joinRoom', params)
    }, [params])

    return (
        <div>
            aab
        </div>
    )
}