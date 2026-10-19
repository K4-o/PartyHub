import { Server, Socket } from 'socket.io';
import { RoomState, TabooState, TabooCard, TeamId } from '../types';
import { getRoom, getTeamPlayers, getConnectedPlayers } from '../RoomManager';

const TABOO_CARDS: TabooCard[] = [
  { id: 'tb_1', word: 'مندي', category: 'أكلات', forbidden: ['رز', 'لحم', 'دجاج', 'حفرة', 'برميل'] },
  { id: 'tb_2', word: 'استراحة', category: 'طلعات', forbidden: ['شباب', 'إيجار', 'مسبح', 'بلوت', 'ويكند'] },
  { id: 'tb_3', word: 'البيك', category: 'مطاعم', forbidden: ['مسحب', 'ثوم', 'بروست', 'جدة', 'زحمة'] },
  { id: 'tb_4', word: 'ساهر', category: 'الشارع', forbidden: ['كاميرا', 'مخالفة', 'سرعة', 'فلاش', 'مرور'] },
  { id: 'tb_5', word: 'بلوت', category: 'ألعاب', forbidden: ['ورق', 'صن', 'حكم', 'مشاريع', 'أربعة'] },
  { id: 'tb_6', word: 'كشتة', category: 'طلعات', forbidden: ['بر', 'خيمة', 'شبة ضو', 'شتاء', 'طعوس'] },
  { id: 'tb_7', word: 'شاورما', category: 'أكلات', forbidden: ['ثوم', 'سيخ', 'خبز', 'دجاج', 'مخلل'] },
  { id: 'tb_8', word: 'بنشري', category: 'سيارات', forbidden: ['كفر', 'زيت', 'رقعة', 'هواء', 'محطة'] },
  { id: 'tb_9', word: 'مناقشة تخرج', category: 'جامعة', forbidden: ['مشروع', 'دكتور', 'عرض', 'بحث', 'درجة'] },
  { id: 'tb_10', word: 'قهوة سعودية', category: 'مشروبات', forbidden: ['هيل', 'دلة', 'فنجال', 'تمر', 'زعفران'] },
  { id: 'tb_11', word: 'حلاق', category: 'حياة يومية', forbidden: ['شعر', 'دقن', 'موس', 'مقص', 'نعيماً'] },
  { id: 'tb_12', word: 'تطبيق هنقرستيشن', category: 'تطبيقات', forbidden: ['توصيل', 'مطعم', 'مندوب', 'طلب', 'أصفر'] },
  { id: 'tb_13', word: 'ثوب العيد', category: 'مناسبات', forbidden: ['خياط', 'مقاس', 'جديد', 'شماغ', 'رمضان'] },
  { id: 'tb_14', word: 'بطارية الجوال', category: 'تقنية', forbidden: ['شاحن', 'نسبة', 'طفا', 'باوربانك', 'كهرباء'] },
  { id: 'tb_15', word: 'خط سفر', category: 'سفر', forbidden: ['سيارة', 'مثبت سرعة', 'محطة', 'طريق', 'مسافة'] },
  { id: 'tb_16', word: 'عريكة', category: 'أكلات', forbidden: ['جنوب', 'سمن', 'عسل', 'بر', 'تمر'] },
  { id: 'tb_17', word: 'بلايستيشن', category: 'ألعاب', forbidden: ['يد', 'سوني', 'فيفا', 'شاشة', 'أونلاين'] },
  { id: 'tb_18', word: 'تفتيش', category: 'الشارع', forbidden: ['شرطة', 'نقطة', 'رخصة', 'استمارة', 'اثبات'] },
  { id: 'tb_19', word: 'عزيمة عشاء', category: 'مناسبات', forbidden: ['ضيوف', 'ذبيحة', 'مجلس', 'كرم', 'تفضلوا'] },
  { id: 'tb_20', word: 'مكيف سبلت', category: 'أجهزة', forbidden: ['حار', 'بارد', 'ريموت', 'فريون', 'صيف'] },
  { id: 'tb_21', word: 'مطبخ سعودي', category: 'أكلات', forbidden: ['سلوق', 'هريس', 'جريش', 'طبخ', 'ذبيحة'] },
  { id: 'tb_22', word: 'تويتر', category: 'تقنية', forbidden: ['X', 'تغريدة', 'ترند', 'تريد', 'هاشتاق'] },
  { id: 'tb_23', word: 'رمضان كريم', category: 'مناسبات', forbidden: ['صيام', 'إفطار', 'سحور', 'تراويح', 'زكاة'] },
  { id: 'tb_24', word: 'مسبح', category: 'طلعات', forbidden: ['ماء', 'سباحة', 'حر', 'كلور', 'بكيني'] },
  { id: 'tb_25', word: 'دكتور الطوارئ', category: 'طب', forbidden: ['مستشفى', 'طبيب', 'إسعاف', 'حادث', 'علاج'] },
];

const usedCards = new Map<string, Set<string>>();
const activeTimers = new Map<string, NodeJS.Timeout>();
const teamDescriberIndices = new Map<string, { A: number; B: number }>();

function getNextCard(roomCode: string): TabooCard | null {
  const used = usedCards.get(roomCode) || new Set();
  const available = TABOO_CARDS.filter(c => !used.has(c.id));
  if (available.length === 0) {
    usedCards.set(roomCode, new Set());
    return TABOO_CARDS[Math.floor(Math.random() * TABOO_CARDS.length)];
  }
  const card = available[Math.floor(Math.random() * available.length)];
  used.add(card.id);
  usedCards.set(roomCode, used);
  return card;
}

function getNextDescriber(room: RoomState, team: TeamId): string {
  const players = getTeamPlayers(room, team);
  if (players.length === 0) return '';
  const indices = teamDescriberIndices.get(room.code) || { A: 0, B: 0 };
  const idx = indices[team] % players.length;
  indices[team] = idx + 1;
  teamDescriberIndices.set(room.code, indices);
  return players[idx].deviceId;
}

function getAuditor(room: RoomState, opposingTeam: TeamId): string {
  const players = getTeamPlayers(room, opposingTeam);
  if (players.length === 0) return '';
  return players[0].deviceId;
}

export function startTabooGame(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  usedCards.set(roomCode, new Set());
  teamDescriberIndices.set(roomCode, { A: 0, B: 0 });
  room.teams.A.score = 0;
  room.teams.B.score = 0;

  const firstTeam: TeamId = 'A';
  startTurn(io, roomCode, firstTeam, 1);
}

function startTurn(io: Server, roomCode: string, activeTeam: TeamId, roundNumber: number): void {
  const room = getRoom(roomCode);
  if (!room) return;

  const opposingTeam: TeamId = activeTeam === 'A' ? 'B' : 'A';
  const describerDeviceId = getNextDescriber(room, activeTeam);
  const auditorDeviceId = getAuditor(room, opposingTeam);

  const state: TabooState = {
    gameId: 'TABOO',
    subPhase: 'TURN_READY',
    activeTeam,
    describerDeviceId,
    auditorDeviceId,
    timeRemaining: room.settings.roundDurationSeconds,
    currentCard: null,
    passesUsed: 0,
    turnStats: {
      correctCount: 0,
      passCount: 0,
      violationCount: 0,
      history: [],
    },
    roundNumber,
    maxRounds: 3,
  };

  room.gameState = state;
  room.phase = 'IN_GAME';
  io.to(roomCode).emit('room:state', room);
}

export function startTabooTurn(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'TABOO') return;

  const state = room.gameState as TabooState;
  state.subPhase = 'DESCRIBING';
  state.currentCard = getNextCard(roomCode);
  state.passesUsed = 0;
  state.timeRemaining = room.settings.roundDurationSeconds;

  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('taboo:turn_started');

  startTurnTimer(io, roomCode);
}

function startTurnTimer(io: Server, roomCode: string): void {
  clearInterval(activeTimers.get(roomCode));

  const timer = setInterval(() => {
    const room = getRoom(roomCode);
    if (!room || !room.gameState || room.gameState.gameId !== 'TABOO') {
      clearInterval(timer);
      return;
    }

    const state = room.gameState as TabooState;
    state.timeRemaining--;

    if (state.timeRemaining <= 0) {
      clearInterval(timer);
      activeTimers.delete(roomCode);
      endTabooTurn(io, roomCode);
    } else {
      io.to(roomCode).emit('taboo:tick', { timeRemaining: state.timeRemaining });
      if (state.timeRemaining <= 5) {
        io.to(roomCode).emit('sound:urgent_tick');
      }
    }
  }, 1000);

  activeTimers.set(roomCode, timer);
}

export function handleTabooAction(
  io: Server,
  roomCode: string,
  action: 'CORRECT' | 'PASS' | 'VIOLATION'
): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'TABOO') return;

  const state = room.gameState as TabooState;
  if (state.subPhase !== 'DESCRIBING' || !state.currentCard) return;

  const word = state.currentCard.word;

  switch (action) {
    case 'CORRECT':
      room.teams[state.activeTeam].score = Math.max(0, room.teams[state.activeTeam].score + 1);
      state.turnStats.correctCount++;
      state.turnStats.history.push({ word, outcome: 'CORRECT' });
      io.to(roomCode).emit('sound:correct');
      break;

    case 'PASS':
      if (state.passesUsed >= 3) return;
      state.passesUsed++;
      state.turnStats.passCount++;
      state.turnStats.history.push({ word, outcome: 'PASS' });
      io.to(roomCode).emit('sound:flip');
      break;

    case 'VIOLATION':
      room.teams[state.activeTeam].score = Math.max(0, room.teams[state.activeTeam].score - 1);
      state.turnStats.violationCount++;
      state.turnStats.history.push({ word, outcome: 'VIOLATION' });
      io.to(roomCode).emit('sound:strike');
      io.to(roomCode).emit('taboo:violation_flash');
      break;
  }

  state.currentCard = getNextCard(roomCode);
  room.gameState = state;
  io.to(roomCode).emit('room:state', room);

  // Check win condition
  if (
    room.teams[state.activeTeam].score >= room.settings.targetWinScore ||
    room.teams[state.activeTeam === 'A' ? 'B' : 'A'].score >= room.settings.targetWinScore
  ) {
    clearInterval(activeTimers.get(roomCode));
    activeTimers.delete(roomCode);
    endGame(io, roomCode);
    return;
  }
}

function endTabooTurn(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'TABOO') return;

  const state = room.gameState as TabooState;
  state.subPhase = 'TURN_SUMMARY';
  state.currentCard = null;

  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('sound:strike');
}

export function nextTabooTurn(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'TABOO') return;

  const state = room.gameState as TabooState;
  const nextTeam: TeamId = state.activeTeam === 'A' ? 'B' : 'A';
  let nextRound = state.roundNumber;

  if (nextTeam === 'A') nextRound++;

  if (nextRound > state.maxRounds) {
    endGame(io, roomCode);
    return;
  }

  startTurn(io, roomCode, nextTeam, nextRound);
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

export function correctTabooHistoryItem(
  io: Server,
  roomCode: string,
  index: number,
  newOutcome: 'CORRECT' | 'PASS' | 'VIOLATION'
): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'TABOO') return;

  const state = room.gameState as TabooState;
  const item = state.turnStats.history[index];
  if (!item) return;

  const oldOutcome = item.outcome;
  item.outcome = newOutcome;

  // Undo old effect
  if (oldOutcome === 'CORRECT') {
    room.teams[state.activeTeam].score = Math.max(0, room.teams[state.activeTeam].score - 1);
    state.turnStats.correctCount--;
  } else if (oldOutcome === 'VIOLATION') {
    room.teams[state.activeTeam].score += 1;
    state.turnStats.violationCount--;
  } else if (oldOutcome === 'PASS') {
    state.turnStats.passCount--;
  }

  // Apply new effect
  if (newOutcome === 'CORRECT') {
    room.teams[state.activeTeam].score += 1;
    state.turnStats.correctCount++;
  } else if (newOutcome === 'VIOLATION') {
    room.teams[state.activeTeam].score = Math.max(0, room.teams[state.activeTeam].score - 1);
    state.turnStats.violationCount++;
  } else if (newOutcome === 'PASS') {
    state.turnStats.passCount++;
  }

  io.to(roomCode).emit('room:state', room);
}

export function cleanupTaboo(roomCode: string): void {
  const timer = activeTimers.get(roomCode);
  if (timer) clearInterval(timer);
  activeTimers.delete(roomCode);
  usedCards.delete(roomCode);
  teamDescriberIndices.delete(roomCode);
}
