import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // In production, replace with your frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] New client connected: ${socket.id}`);

    // Join a room based on email address to receive targeted updates
    socket.on('join_inbox', (email: string) => {
      if (email) {
        const room = `inbox_${email.toLowerCase().trim()}`;
        socket.join(room);
        console.log(`[Socket] Client ${socket.id} joined room: ${room}`);
      }
    });

    // Join a room based on user ID for global updates across all their emails
    socket.on('join_user', (userId: string | number) => {
      if (userId) {
        const room = `user_${userId}`;
        socket.join(room);
        console.log(`[Socket] 👤 User joined private room: ${room} (Socket ID: ${socket.id})`);
      }
    });

    // Admin-only room for dashboard real-time stats
    socket.on('join_admin', (role: string) => {
      if (role === 'ADMIN') {
        socket.join('admin_nexus');
        console.log(`[Socket] 🛡️ ADMIN joined Nexus room (Socket ID: ${socket.id})`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] 🔌 Client disconnected: ${socket.id}`);
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
    console.log(`[Socket] 🛡️ BROADCAST: Admin stats updated`);
  }
};

export const broadcastAdminUserUpdate = () => {
  if (io) {
    io.to('admin_nexus').emit('admin_user_refresh');
    console.log(`[Socket] 🛡️ BROADCAST: Admin user refresh required`);
  }
};

export const emitToUser = (userId: number, event: string, data: any) => {
  if (io) {
    const room = `user_${userId}`;
    io.to(room).emit(event, data);
    console.log(`[Socket] 📡 BROADCAST: Event "${event}" sent to room ${room}`);
  }
};

export const emitNewEmail = (email: string, message: any) => {
  if (io) {
    const room = `inbox_${email.toLowerCase().trim()}`;
    io.to(room).emit('new_email', message);
    console.log(`[Socket] Emitted new_email to inbox room: ${room}`);
  }
};
