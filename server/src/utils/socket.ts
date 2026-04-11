import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['https://tempgenpro.com', 'https://www.tempgenpro.com'];

  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
      methods: ['GET', 'POST'],
    },
    // ⚡ Production-tuned ping settings for fast dead-socket cleanup
    pingTimeout: 20000,   // 20s: how long to wait for a pong before considering dead
    pingInterval: 25000,  // 25s: how often to send a ping
    transports: ['websocket', 'polling'], // WebSocket preferred, polling fallback
  });

  io.on('connection', (socket) => {
    // Join a room based on email address to receive targeted updates
    socket.on('join_inbox', (email: string) => {
      if (email) {
        socket.join(`inbox_${email.toLowerCase().trim()}`);
      }
    });

    // Join a room based on user ID for global updates across all their emails
    socket.on('join_user', (userId: string | number) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Admin-only room for dashboard real-time stats
    socket.on('join_admin', (role: string) => {
      if (role === 'ADMIN') {
        socket.join('admin_nexus');
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const broadcastAdminStats = (data: any) => {
  if (io) {
    io.to('admin_nexus').emit('admin_stats_update', data);
  }
};

export const broadcastAdminUserUpdate = () => {
  if (io) {
    io.to('admin_nexus').emit('admin_user_refresh');
  }
};

export const emitToUser = (userId: number, event: string, data: any) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

export const emitNewEmail = (email: string, message: any) => {
  if (io) {
    io.to(`inbox_${email.toLowerCase().trim()}`).emit('new_email', message);
  }
};
