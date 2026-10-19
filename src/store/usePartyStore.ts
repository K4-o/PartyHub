import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { RoomState } from '../types/game';
import { soundEngine } from '../utils/SoundEngine';

interface PartyStore {
  // Connection
  socket: Socket | null;
  isConnected: boolean;

  // Room
  room: RoomState | null;
  roomCode: string;
  lanIp: string;

  // Player identity
  deviceId: string;
  playerName: string;
  playerAvatar: string;

  // UI
  showViolationFlash: boolean;
  showStrikeOverlay: number; // 0 = none, 1/2/3 = strike count
  showQRModal: boolean;
  isMuted: boolean;
  baseUrl: string;

  // Game over
  gameOverData: { winner: string; teams: RoomState['teams'] } | null;

  // Actions
  initSocket: () => void;
  createRoom: () => Promise<void>;
  joinRoom: (code: string, name: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  emit: (event: string, data?: unknown) => void;
  setRoomCode: (code: string) => void;
  setPlayerName: (name: string) => void;
  setPlayerAvatar: (avatar: string) => void;
  setShowQRModal: (show: boolean) => void;
  setMuted: (muted: boolean) => void;
  setBaseUrl: (url: string) => void;
  setLanIp: (ip: string) => void;
  clearGameOver: () => void;
}

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('partyhub_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('partyhub_device_id', id);
  }
  return id;
}

export const usePartyStore = create<PartyStore>((set, get) => ({
  socket: null,
  isConnected: false,
  room: null,
  roomCode: '',
  lanIp: 'localhost',
  deviceId: getOrCreateDeviceId(),
  playerName: localStorage.getItem('partyhub_name') || '',
  playerAvatar: localStorage.getItem('partyhub_avatar') || '🦁',
  showViolationFlash: false,
  showStrikeOverlay: 0,
  showQRModal: false,
  isMuted: false,
  baseUrl: '',
  gameOverData: null,

  initSocket: () => {
    const existing = get().socket;
    if (existing?.connected) return;

    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('room:state', (room: RoomState) => {
      set({ room, roomCode: room.code, lanIp: room.lanIp });
    });

    // Sound events
    socket.on('sound:correct', () => soundEngine.playCorrect());
    socket.on('sound:strike', () => soundEngine.playStrike());
    socket.on('sound:buzzer', () => soundEngine.playBuzzer());
    socket.on('sound:flip', () => soundEngine.playFlip());
    socket.on('sound:victory', () => soundEngine.playVictory());
    socket.on('sound:urgent_tick', () => soundEngine.playTick(true));

    // Taboo events
    socket.on('taboo:violation_flash', () => {
      set({ showViolationFlash: true });
      setTimeout(() => set({ showViolationFlash: false }), 600);
    });

    // Family Feud strike overlay
    socket.on('feud:strike', ({ strikes }: { strikes: number }) => {
      set({ showStrikeOverlay: strikes });
      setTimeout(() => set({ showStrikeOverlay: 0 }), 1500);
    });

    // Game over
    socket.on('game:over', (data: { winner: string; teams: RoomState['teams'] }) => {
      set({ gameOverData: data });
    });

    set({ socket });
  },

  createRoom: async () => {
    const { socket } = get();
    if (!socket) return;

    return new Promise((resolve) => {
      socket.emit('host:create_room', (response: { roomCode: string; lanIp: string; room?: RoomState }) => {
        set({
          room: response.room || null,
          roomCode: response.roomCode,
          baseUrl:
            typeof window !== 'undefined' &&
            window.location.hostname !== 'localhost' &&
            !window.location.hostname.startsWith('192.168.') &&
            !window.location.hostname.startsWith('10.') &&
            !window.location.hostname.startsWith('127.')
              ? window.location.origin
              : `http://${response.lanIp}:5173`,
        });
        resolve();
      });
    });
  },

  joinRoom: async (code: string, name: string, avatar: string) => {
    const { socket, deviceId } = get();
    if (!socket) return { success: false, error: 'No connection' };

    localStorage.setItem('partyhub_name', name);
    localStorage.setItem('partyhub_avatar', avatar);
    set({ playerName: name, playerAvatar: avatar });

    return new Promise((resolve) => {
      socket.emit(
        'player:join',
        { roomCode: code.toUpperCase(), deviceId, name, avatar },
        (response: { room?: RoomState; error?: string }) => {
          if (response.error) {
            resolve({ success: false, error: response.error });
          } else {
            set({ room: response.room || null, roomCode: code.toUpperCase() });
            resolve({ success: true });
          }
        }
      );
    });
  },

  emit: (event: string, data?: unknown) => {
    const { socket } = get();
    if (socket) socket.emit(event, data);
  },

  setRoomCode: (code) => set({ roomCode: code }),
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerAvatar: (avatar) => set({ playerAvatar: avatar }),
  setShowQRModal: (show) => set({ showQRModal: show }),
  setMuted: (muted) => {
    soundEngine.setMuted(muted);
    set({ isMuted: muted });
  },
  setBaseUrl: (url) => set({ baseUrl: url }),
  setLanIp: (ip) => set({ lanIp: ip }),
  clearGameOver: () => set({ gameOverData: null }),
}));
