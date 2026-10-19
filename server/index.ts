import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  getLanIp,
  createRoom,
  getRoom,
  joinRoom,
  disconnectPlayer,
  updateHostSocket,
  updateRoomSettings,
  addSocketToDevice,
  getDeviceFromSocket,
  updateTeamNames,
  movePlayerTeam,
  kickPlayer,
} from './RoomManager';
import {
  startTabooGame,
  startTabooTurn,
  handleTabooAction,
  nextTabooTurn,
  correctTabooHistoryItem,
  cleanupTaboo,
} from './engines/TabooEngine';
import {
  startWavelengthGame,
  wavelengthSubmitClue,
  wavelengthMoveDial,
  wavelengthLockIn,
  wavelengthNextRound,
  revealWavelength,
  cleanupWavelength,
} from './engines/WavelengthEngine';
import {
  startFamilyFeudGame,
  feudBuzz,
  feudAssignControl,
  feudRevealAnswer,
  feudStrike,
  feudStealAnswer,
  feudStealMiss,
  feudNextRound,
  feudResetBuzzer,
  cleanupFamilyFeud,
} from './engines/FamilyFeudEngine';
import {
  startSpyfallGame,
  startSpyfallDiscussion,
  startVoting,
  spyfallVote,
  spyfallSpyGuess,
  cleanupSpyfall,
} from './engines/SpyfallEngine';
import { RoomState } from './types';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;
const lanIp = getLanIp();

app.use(express.json());

// Serve static assets from Vite build in production
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('/api/lan-ip', (_req, res) => {
  res.json({ lanIp });
});

// Serve a 200 health check
app.get('/health', (_req, res) => res.send('OK'));

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ─── HOST EVENTS ──────────────────────────────────────────────────────────

  socket.on('host:create_room', (callback) => {
    const room = createRoom(socket.id, lanIp);
    socket.join(room.code);
    socket.emit('room:state', room);
    console.log(`[Room] Created: ${room.code} by ${socket.id}`);
    if (typeof callback === 'function') {
      callback({ roomCode: room.code, lanIp: room.lanIp, room });
    }
  });

  socket.on('host:rejoin', (roomCode: string, callback) => {
    const room = getRoom(roomCode);
    if (!room) {
      if (typeof callback === 'function') callback({ error: 'Room not found' });
      return;
    }
    updateHostSocket(roomCode, socket.id);
    socket.join(roomCode);
    if (typeof callback === 'function') callback({ room });
    io.to(roomCode).emit('room:state', room);
  });

  socket.on('host:update_settings', (data: { roomCode: string; settings: Partial<RoomState['settings']> }) => {
    const room = updateRoomSettings(data.roomCode, data.settings);
    if (room) io.to(data.roomCode).emit('room:state', room);
  });

  socket.on('host:update_team_names', (data: { roomCode: string; teamAName?: string; teamBName?: string }) => {
    const room = updateTeamNames(data.roomCode, data.teamAName, data.teamBName);
    if (room) io.to(data.roomCode).emit('room:state', room);
  });

  socket.on('host:move_player_team', (data: { roomCode: string; deviceId: string; targetTeam: 'A' | 'B' }) => {
    const room = movePlayerTeam(data.roomCode, data.deviceId, data.targetTeam);
    if (room) io.to(data.roomCode).emit('room:state', room);
  });

  socket.on('host:kick_player', (data: { roomCode: string; deviceId: string }) => {
    const room = kickPlayer(data.roomCode, data.deviceId);
    if (room) io.to(data.roomCode).emit('room:state', room);
  });

  socket.on('host:select_game', (data: { roomCode: string; gameId: string }) => {
    const room = getRoom(data.roomCode);
    if (!room) return;
    room.selectedGame = data.gameId as RoomState['selectedGame'];
    room.phase = 'RULES_PREVIEW';
    io.to(data.roomCode).emit('room:state', room);
  });

  socket.on('host:start_game', (data: { roomCode: string }) => {
    const room = getRoom(data.roomCode);
    if (!room) return;

    switch (room.selectedGame) {
      case 'TABOO':
        startTabooGame(io, data.roomCode);
        break;
      case 'WAVELENGTH':
        startWavelengthGame(io, data.roomCode);
        break;
      case 'FAMILY_FEUD':
        startFamilyFeudGame(io, data.roomCode);
        break;
      case 'SPYFALL':
        startSpyfallGame(io, data.roomCode);
        break;
    }
  });

  socket.on('host:reset_to_lobby', (data: { roomCode: string }) => {
    const room = getRoom(data.roomCode);
    if (!room) return;

    // Cleanup any running engines
    cleanupTaboo(data.roomCode);
    cleanupWavelength(data.roomCode);
    cleanupFamilyFeud(data.roomCode);
    cleanupSpyfall(data.roomCode);

    room.phase = 'LOBBY';
    room.selectedGame = null;
    room.gameState = null;
    room.teams.A.score = 0;
    room.teams.B.score = 0;

    io.to(data.roomCode).emit('room:state', room);
  });

  socket.on('host:switch_game', (data: { roomCode: string }) => {
    const room = getRoom(data.roomCode);
    if (!room) return;

    cleanupTaboo(data.roomCode);
    cleanupWavelength(data.roomCode);
    cleanupFamilyFeud(data.roomCode);
    cleanupSpyfall(data.roomCode);

    room.phase = 'GAME_SELECT';
    room.selectedGame = null;
    room.gameState = null;

    io.to(data.roomCode).emit('room:state', room);
  });

  // ─── PLAYER EVENTS ────────────────────────────────────────────────────────

  socket.on('player:join', (data: { roomCode: string; deviceId: string; name: string; avatar: string }, callback) => {
    const result = joinRoom(data.roomCode.toUpperCase(), socket.id, data.deviceId, data.name, data.avatar);
    if (!result.success || !result.room) {
      if (typeof callback === 'function') callback({ error: result.error });
      return;
    }

    socket.join(data.roomCode.toUpperCase());
    io.to(data.roomCode.toUpperCase()).emit('room:state', result.room);

    if (typeof callback === 'function') {
      callback({ room: result.room, isReconnect: result.isReconnect });
    }
    console.log(`[Player] ${data.name} joined room ${data.roomCode}`);
  });

  socket.on('player:ready', (data: { roomCode: string; deviceId: string }) => {
    const room = getRoom(data.roomCode);
    if (!room) return;
    const player = room.players[data.deviceId];
    if (player) {
      player.isReady = !player.isReady;
      io.to(data.roomCode).emit('room:state', room);
    }
  });

  socket.on('player:change_team', (data: { roomCode: string; deviceId: string; team: 'A' | 'B' }) => {
    const room = getRoom(data.roomCode);
    if (!room) return;
    const player = room.players[data.deviceId];
    if (player) {
      player.team = data.team;
      io.to(data.roomCode).emit('room:state', room);
    }
  });

  // ─── TABOO EVENTS ─────────────────────────────────────────────────────────

  socket.on('taboo:start_turn', (data: { roomCode: string }) => {
    startTabooTurn(io, data.roomCode);
  });

  socket.on('taboo:action', (data: { roomCode: string; action: 'CORRECT' | 'PASS' | 'VIOLATION' }) => {
    handleTabooAction(io, data.roomCode, data.action);
  });

  socket.on('taboo:next_turn', (data: { roomCode: string }) => {
    nextTabooTurn(io, data.roomCode);
  });

  socket.on('taboo:correct_history', (data: { roomCode: string; index: number; outcome: 'CORRECT' | 'PASS' | 'VIOLATION' }) => {
    correctTabooHistoryItem(io, data.roomCode, data.index, data.outcome);
  });

  // ─── WAVELENGTH EVENTS ────────────────────────────────────────────────────

  socket.on('wavelength:submit_clue', (data: { roomCode: string; clueText: string }) => {
    wavelengthSubmitClue(io, data.roomCode, data.clueText);
  });

  socket.on('wavelength:move_dial', (data: { roomCode: string; value: number }) => {
    wavelengthMoveDial(io, data.roomCode, data.value);
  });

  socket.on('wavelength:lock_in', (data: { roomCode: string }) => {
    wavelengthLockIn(io, data.roomCode);
  });

  socket.on('wavelength:next_round', (data: { roomCode: string }) => {
    wavelengthNextRound(io, data.roomCode);
  });

  socket.on('wavelength:force_reveal', (data: { roomCode: string }) => {
    revealWavelength(io, data.roomCode);
  });

  // ─── FAMILY FEUD EVENTS ───────────────────────────────────────────────────

  socket.on('feud:buzz', (data: { roomCode: string; deviceId: string }) => {
    feudBuzz(io, data.roomCode, data.deviceId);
  });

  socket.on('feud:assign_control', (data: { roomCode: string; team: 'A' | 'B' }) => {
    feudAssignControl(io, data.roomCode, data.team);
  });

  socket.on('feud:reveal_answer', (data: { roomCode: string; answerIndex: number }) => {
    feudRevealAnswer(io, data.roomCode, data.answerIndex);
  });

  socket.on('feud:strike', (data: { roomCode: string }) => {
    feudStrike(io, data.roomCode);
  });

  socket.on('feud:steal_answer', (data: { roomCode: string; answerIndex: number }) => {
    feudStealAnswer(io, data.roomCode, data.answerIndex);
  });

  socket.on('feud:steal_miss', (data: { roomCode: string }) => {
    feudStealMiss(io, data.roomCode);
  });

  socket.on('feud:next_round', (data: { roomCode: string }) => {
    feudNextRound(io, data.roomCode);
  });

  socket.on('feud:reset_buzzer', (data: { roomCode: string }) => {
    feudResetBuzzer(io, data.roomCode);
  });

  // ─── SPYFALL EVENTS ───────────────────────────────────────────────────────

  socket.on('spyfall:start_discussion', (data: { roomCode: string }) => {
    startSpyfallDiscussion(io, data.roomCode);
  });

  socket.on('spyfall:start_voting', (data: { roomCode: string }) => {
    startVoting(io, data.roomCode);
  });

  socket.on('spyfall:vote', (data: { roomCode: string; voterDeviceId: string; suspectedDeviceId: string }) => {
    spyfallVote(io, data.roomCode, data.voterDeviceId, data.suspectedDeviceId);
  });

  socket.on('spyfall:spy_guess', (data: { roomCode: string; guessedLocation: string }) => {
    spyfallSpyGuess(io, data.roomCode, data.guessedLocation);
  });

  // ─── DISCONNECT ───────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const { room, deviceId } = disconnectPlayer(socket.id);
    if (room && deviceId) {
      io.to(room.code).emit('room:state', room);
      io.to(room.code).emit('player:disconnected', { deviceId });
      console.log(`[Socket] Disconnected: ${socket.id} (device: ${deviceId})`);
    }
  });
});

// Fallback for SPA client-side routing in production
if (fs.existsSync(distPath)) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎉 PartyHub Server running!`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://${lanIp}:${PORT}`);
  console.log(`   LAN IP:   ${lanIp}\n`);
});
