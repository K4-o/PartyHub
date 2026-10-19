import { Server } from 'socket.io';
import { RoomState, WavelengthState, WavelengthCard, TeamId } from '../types';
import { getRoom, getTeamPlayers } from '../RoomManager';

const WAVELENGTH_CARDS: WavelengthCard[] = [
  { id: 'wl_1', leftPole: 'مطعم رخيص ويسد الجوع', rightPole: 'مطعم غالي وما يشبع', category: 'مطاعم' },
  { id: 'wl_2', leftPole: 'عادة سيئة جداً', rightPole: 'عادة صحية ومثالية', category: 'أسلوب حياة' },
  { id: 'wl_3', leftPole: 'فيلم يرفع الضغط وممل', rightPole: 'تحفة سينمائية تاريخية', category: 'أفلام' },
  { id: 'wl_4', leftPole: 'سيارة اعتمادية ما تطلب قطع', rightPole: 'سيارة كل أسبوع بالصناعية', category: 'سيارات' },
  { id: 'wl_5', leftPole: 'شخصية هادية ومسالمة', rightPole: 'شخصية تدور المشاكل', category: 'شخصيات' },
  { id: 'wl_6', leftPole: 'تطبيق ما تقدر تعيش بدونه', rightPole: 'تطبيق ما له أي فايدة بجوالك', category: 'تقنية' },
  { id: 'wl_7', leftPole: 'عذر مقنع لما تتأخر', rightPole: 'كذبة مكشوفة محد يصدقها', category: 'مواقف' },
  { id: 'wl_8', leftPole: 'أكلة ثقيلة تجيب النوم', rightPole: 'أكلة خفيفة وصحية', category: 'أكلات' },
  { id: 'wl_9', leftPole: 'مادة جامعية سهلة (مضمونة A+)', rightPole: 'مادة معقدة وتجيب الصداع', category: 'دراسة' },
  { id: 'wl_10', leftPole: 'هدية تفرح القلب', rightPole: 'هدية تسليكية مالها داعي', category: 'مناسبات' },
  { id: 'wl_11', leftPole: 'مدينة جوها خيالي وبارد', rightPole: 'مدينة حر ورطوبة لا تطاق', category: 'سفر' },
  { id: 'wl_12', leftPole: 'لعبة تزيد المحبة بين الأصحاب', rightPole: 'لعبة تفرق الشلة وتسبب هواش', category: 'ألعاب' },
  { id: 'wl_13', leftPole: 'مهارة مفيدة جداً بالحياة', rightPole: 'مهارة استعراضية مالها فايدة', category: 'مهارات' },
  { id: 'wl_14', leftPole: 'صوت مريح للأعصاب', rightPole: 'صوت يوتر ويجيب القلق', category: 'حواس' },
  { id: 'wl_15', leftPole: 'قرار مالي ذكي', rightPole: 'تضييع فلوس على الفاضي', category: 'مال' },
  { id: 'wl_16', leftPole: 'لقاء مرحب فيه', rightPole: 'اجتماع يتمنى ما حضره', category: 'اجتماعات' },
  { id: 'wl_17', leftPole: 'سلوك محترم ومحبوب', rightPole: 'تصرف يخجل منه الكل', category: 'سلوك' },
  { id: 'wl_18', leftPole: 'أغنية تحمسك وترفع معنوياتك', rightPole: 'أغنية تجيب التعاسة', category: 'موسيقى' },
  { id: 'wl_19', leftPole: 'عمل تحلم فيه كل يوم', rightPole: 'عمل ما تتمناه لعدوك', category: 'مهن' },
  { id: 'wl_20', leftPole: 'وجبة إفطار مثالية', rightPole: 'وجبة إفطار لا تطاق', category: 'أكلات' },
];

const usedCards = new Map<string, Set<string>>();
const stealTimers = new Map<string, NodeJS.Timeout>();
const psychicIndices = new Map<string, { A: number; B: number }>();

function getNextCard(roomCode: string): WavelengthCard {
  const used = usedCards.get(roomCode) || new Set();
  const available = WAVELENGTH_CARDS.filter(c => !used.has(c.id));
  const pool = available.length > 0 ? available : WAVELENGTH_CARDS;
  const card = pool[Math.floor(Math.random() * pool.length)];
  used.add(card.id);
  usedCards.set(roomCode, used);
  return card;
}

function getNextPsychic(room: RoomState, team: TeamId): string {
  const players = getTeamPlayers(room, team);
  if (players.length === 0) return '';
  const indices = psychicIndices.get(room.code) || { A: 0, B: 0 };
  const idx = indices[team] % players.length;
  indices[team] = idx + 1;
  psychicIndices.set(room.code, indices);
  return players[idx].deviceId;
}

export function startWavelengthGame(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  usedCards.set(roomCode, new Set());
  psychicIndices.set(roomCode, { A: 0, B: 0 });
  room.teams.A.score = 0;
  room.teams.B.score = 0;

  startRound(io, roomCode, 'A', 1);
}

function startRound(io: Server, roomCode: string, activeTeam: TeamId, roundNumber: number): void {
  const room = getRoom(roomCode);
  if (!room) return;

  const card = getNextCard(roomCode);
  const targetCenter = Math.floor(Math.random() * 77) + 12; // 12–88
  const psychicDeviceId = getNextPsychic(room, activeTeam);

  const state: WavelengthState = {
    gameId: 'WAVELENGTH',
    subPhase: 'PSYCHIC_CLUE',
    activeTeam,
    psychicDeviceId,
    card,
    clueText: '',
    targetCenter,
    teamDialValue: 50,
    opponentPrediction: null,
    stealTimeRemaining: 20,
    lastRoundPoints: { activeTeamEarned: 0, opponentTeamEarned: 0 },
    roundNumber,
    maxRounds: 4,
  };

  room.gameState = state;
  room.phase = 'IN_GAME';
  io.to(roomCode).emit('room:state', room);
}

export function wavelengthSubmitClue(io: Server, roomCode: string, clueText: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'WAVELENGTH') return;

  const state = room.gameState as WavelengthState;
  state.clueText = clueText;
  state.subPhase = 'TEAM_GUESS';
  state.teamDialValue = 50;

  io.to(roomCode).emit('room:state', room);
}

export function wavelengthMoveDial(io: Server, roomCode: string, value: number): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'WAVELENGTH') return;

  const state = room.gameState as WavelengthState;
  if (state.subPhase !== 'TEAM_GUESS') return;

  state.teamDialValue = Math.max(0, Math.min(100, value));
  io.to(roomCode).emit('wavelength:dial_moved', { value: state.teamDialValue });
}

export function wavelengthLockIn(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'WAVELENGTH') return;

  const state = room.gameState as WavelengthState;
  state.subPhase = 'OPPONENT_STEAL';
  state.stealTimeRemaining = 20;

  io.to(roomCode).emit('room:state', room);

  // Auto-proceed after 20s if no prediction
  const timer = setTimeout(() => {
    revealWavelength(io, roomCode);
  }, 20000);
  stealTimers.set(roomCode, timer);
}

export function wavelengthOpponentPredict(
  io: Server,
  roomCode: string,
  prediction: 'LEFT' | 'RIGHT'
): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'WAVELENGTH') return;

  const state = room.gameState as WavelengthState;
  state.opponentPrediction = prediction;

  const timer = stealTimers.get(roomCode);
  if (timer) clearTimeout(timer);
  stealTimers.delete(roomCode);

  revealWavelength(io, roomCode);
}

export function revealWavelength(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'WAVELENGTH') return;

  const state = room.gameState as WavelengthState;
  const diff = Math.abs(state.targetCenter - state.teamDialValue);
  const opposingTeam: TeamId = state.activeTeam === 'A' ? 'B' : 'A';

  let activePoints = 0;
  if (diff <= 3) activePoints = 4;
  else if (diff <= 9) activePoints = 3;
  else if (diff <= 15) activePoints = 2;
  else activePoints = 0;

  let opponentPoints = 0;
  if (diff > 3 && state.opponentPrediction) {
    const correctPrediction =
      (state.opponentPrediction === 'LEFT' && state.targetCenter < state.teamDialValue) ||
      (state.opponentPrediction === 'RIGHT' && state.targetCenter > state.teamDialValue);
    if (correctPrediction) opponentPoints = 1;
  }

  room.teams[state.activeTeam].score += activePoints;
  room.teams[opposingTeam].score += opponentPoints;

  state.lastRoundPoints = { activeTeamEarned: activePoints, opponentTeamEarned: opponentPoints };
  state.subPhase = 'REVEAL';

  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('wavelength:revealed', { diff, activePoints, opponentPoints });

  // Check win
  if (
    room.teams.A.score >= room.settings.targetWinScore ||
    room.teams.B.score >= room.settings.targetWinScore
  ) {
    setTimeout(() => endGame(io, roomCode), 3000);
  } else {
    setTimeout(() => {
      const nextTeam: TeamId = state.activeTeam === 'A' ? 'B' : 'A';
      const nextRound = state.roundNumber + 1;
      if (nextRound > state.maxRounds * 2) {
        endGame(io, roomCode);
      } else {
        startRound(io, roomCode, nextTeam, nextRound);
      }
    }, 4000);
  }
}

function endGame(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;
  room.phase = 'GAME_OVER';
  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('sound:victory');
  io.to(roomCode).emit('game:over', {
    teams: room.teams,
    winner: room.teams.A.score >= room.teams.B.score ? 'A' : 'B',
  });
}

export function cleanupWavelength(roomCode: string): void {
  const timer = stealTimers.get(roomCode);
  if (timer) clearTimeout(timer);
  stealTimers.delete(roomCode);
  usedCards.delete(roomCode);
  psychicIndices.delete(roomCode);
}
