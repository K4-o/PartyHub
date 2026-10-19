import { networkInterfaces } from 'os';
import { RoomState, Player, TeamId } from './types';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding I, O, 0, 1

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

const rooms = new Map<string, RoomState>();
const socketToDevice = new Map<string, { deviceId: string; roomCode: string }>();

export function getLanIp(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

export function createRoom(hostSocketId: string, lanIp: string): RoomState {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room: RoomState = {
    code,
    hostSocketId,
    lanIp,
    phase: 'LOBBY',
    selectedGame: null,
    players: {},
    teams: {
      A: { id: 'A', name: 'فريق الصقور', color: 'emerald', score: 0 },
      B: { id: 'B', name: 'فريق الذئاب', color: 'violet', score: 0 },
    },
    settings: {
      roundDurationSeconds: 60,
      targetWinScore: 15,
      singleScreenMode: false,
    },
    gameState: null,
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code.toUpperCase());
}

export function getAllRooms(): Map<string, RoomState> {
  return rooms;
}

export function joinRoom(
  roomCode: string,
  socketId: string,
  deviceId: string,
  name: string,
  avatar: string
): { success: boolean; error?: string; room?: RoomState; isReconnect?: boolean } {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return { success: false, error: 'الغرفة غير موجودة' };

  socketToDevice.set(socketId, { deviceId, roomCode: roomCode.toUpperCase() });

  const existingPlayer = room.players[deviceId];
  if (existingPlayer) {
    // Reconnect
    existingPlayer.id = socketId;
    existingPlayer.isConnected = true;
    existingPlayer.name = name;
    existingPlayer.avatar = avatar;
    return { success: true, room, isReconnect: true };
  }

  // New player — balance teams
  const teamACnt = Object.values(room.players).filter(p => p.team === 'A').length;
  const teamBCnt = Object.values(room.players).filter(p => p.team === 'B').length;
  const assignedTeam: TeamId = teamACnt <= teamBCnt ? 'A' : 'B';

  const player: Player = {
    id: socketId,
    deviceId,
    name,
    avatar,
    team: assignedTeam,
    score: 0,
    isConnected: true,
    isReady: false,
  };

  room.players[deviceId] = player;
  return { success: true, room };
}

export function disconnectPlayer(socketId: string): { room?: RoomState; deviceId?: string } {
  const entry = socketToDevice.get(socketId);
  if (!entry) return {};

  const { deviceId, roomCode } = entry;
  socketToDevice.delete(socketId);

  const room = rooms.get(roomCode);
  if (!room) return {};

  const player = room.players[deviceId];
  if (player) {
    player.isConnected = false;
  }

  return { room, deviceId };
}

export function updateHostSocket(roomCode: string, newSocketId: string): void {
  const room = rooms.get(roomCode);
  if (room) room.hostSocketId = newSocketId;
}

export function updateRoomSettings(
  roomCode: string,
  settings: Partial<RoomState['settings']>
): RoomState | undefined {
  const room = rooms.get(roomCode);
  if (!room) return undefined;
  room.settings = { ...room.settings, ...settings };
  return room;
}

export function setRoomPhase(roomCode: string, phase: RoomState['phase']): void {
  const room = rooms.get(roomCode);
  if (room) room.phase = phase;
}

export function deleteRoom(roomCode: string): void {
  rooms.delete(roomCode);
}

export function getDeviceFromSocket(socketId: string): { deviceId: string; roomCode: string } | undefined {
  return socketToDevice.get(socketId);
}

export function addSocketToDevice(socketId: string, deviceId: string, roomCode: string): void {
  socketToDevice.set(socketId, { deviceId, roomCode });
}

export function getConnectedPlayers(room: RoomState): Player[] {
  return Object.values(room.players).filter(p => p.isConnected);
}

export function getTeamPlayers(room: RoomState, team: TeamId): Player[] {
  return Object.values(room.players).filter(p => p.team === team && p.isConnected);
}
