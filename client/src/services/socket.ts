import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      console.log(`[Socket] Attempting connection to: ${SOCKET_URL}`);
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] ✅ Connected to server! ID:', this.socket?.id);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] ❌ Connection Error:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] 🔌 Disconnected:', reason);
      });
    }
    return this.socket;
  }

  joinInbox(email: string) {
    if (this.socket) {
      this.socket.emit('join_inbox', email);
    }
  }

  joinUser(userId: number) {
    if (this.socket) {
      this.socket.emit('join_user', userId);
    }
  }

  onNewEmail(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('new_email', callback);
    }
  }

  onGlobalEmail(callback: (data: { email: string, message: any }) => void) {
    if (this.socket) {
      this.socket.on('new_email_global', callback);
    }
  }

  offNewEmail() {
    if (this.socket) {
      this.socket.off('new_email');
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
