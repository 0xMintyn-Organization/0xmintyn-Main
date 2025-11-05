import {Server as SocketIOServer} from 'socket.io';
import http from 'http';

export const initSocketServer = (server: http.Server) => {
    const io = new SocketIOServer(server,
        {
            cors: {
                origin: ['https://advanced-lms-client.vercel.app', 'https://app.0xmintyn.com/'],
                credentials: true,
                methods: ["GET", "POST"]
            }
        }
    );
    
    io.on('connection', (socket) => {
        console.log('Client connected');

        // listen for "notification" event from frontend 
        socket.on('notification', (data) => {
            console.log('Notification received: ', data);
            // broadcast message to all connected clients
            io.emit('newNotification', data);
        });

        // listen for "disconnect" event from frontend
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        }); 
       
    });
    
};