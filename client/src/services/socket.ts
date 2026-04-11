import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.split('/api')[0] 
  : window.location.origin;

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;
  private currentInboxEmail: string | null = null;

  connect() {
    if (!this.socket) {
      console.log(`[Socket] 📡 Connecting to: ${SOCKET_URL}`);
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        autoConnect: true,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] ✅ Connected! ID:', this.socket?.id);
        
        // 🔄 Re-join rooms on reconnection
        if (this.currentUserId) {
          console.log('[Socket] 🔄 Re-joining user room:', this.currentUserId);
          this.socket?.emit('join_user', this.currentUserId);
        }
        if (this.currentInboxEmail) {
          console.log('[Socket] 🔄 Re-joining inbox room:', this.currentInboxEmail);
          this.socket?.emit('join_inbox', this.currentInboxEmail);
        }
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
    this.currentInboxEmail = email;
    if (this.socket?.connected) {
      this.socket.emit('join_inbox', email);
    }
  }

  joinUser(userId: number) {
    this.currentUserId = userId;
    if (this.socket?.connected) {
      this.socket.emit('join_user', userId);
    }
  }

  onNewEmail(callback: (message: any) => void) {
    this.socket?.on('new_email', callback);
  }

  onGlobalEmail(callback: (data: { email: string, message: any }) => void) {
    this.socket?.on('new_email_global', callback);
  }

  offNewEmail() {
    this.socket?.off('new_email');
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
      this.currentInboxEmail = null;
    }
  }
}

export const socketService = new SocketService();
