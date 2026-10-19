import { Server } from 'socket.io';
import { RoomState, FamilyFeudState, FeudAnswer, TeamId } from '../types';
import { getRoom } from '../RoomManager';

const QUESTIONS = [
  {
    id: 'ff_1',
    question: 'شيء يتفقدونه الشباب أول ما يركبون السيارة قبل ما يمشون؟',
    answers: [
      { text: 'الجوال / سلك الشاحن', points: 35 },
      { text: 'المكيف', points: 24 },
      { text: 'البنزين / العداد', points: 18 },
      { text: 'المرايات', points: 13 },
      { text: 'البلوتوث / الصوت', points: 10 },
    ],
  },
  {
    id: 'ff_2',
    question: 'أشهر عذر يقوله الطالب للدكتور إذا دخل القاعة متأخر؟',
    answers: [
      { text: 'زحمة الطريق / حادث', points: 40 },
      { text: 'ما لقيت موقف بالجامعة', points: 25 },
      { text: 'السيارة تعطلت / بنشرت', points: 16 },
      { text: 'كنت مضيع القاعة', points: 11 },
      { text: 'المنبه ما دق / راحت علي نومة', points: 8 },
    ],
  },
  {
    id: 'ff_3',
    question: 'شيء مستحيل تكتمل الكشتة أو الطلعة للبر بدونه؟',
    answers: [
      { text: 'الحطب / شبة الضو', points: 34 },
      { text: 'القهوة والشاهي (العزبة)', points: 28 },
      { text: 'الفرشة / الجلسة', points: 16 },
      { text: 'العشاء / اللحم والدجاج', points: 14 },
      { text: 'ورق البلوت', points: 8 },
    ],
  },
  {
    id: 'ff_4',
    question: 'أكثر جملة تسمعها إذا اتفقتوا تطلعون مع الشباب؟',
    answers: [
      { text: 'وين نروح / وش نتعشى؟', points: 36 },
      { text: 'أنا بالطريق (وهو باقي بالبيت)', points: 27 },
      { text: 'مرّوني ما معي سيارة', points: 17 },
      { text: 'قطّوا / حاسبوا عني وأحول لكم', points: 12 },
      { text: 'احجزوا لنا مكان', points: 8 },
    ],
  },
  {
    id: 'ff_5',
    question: 'شيء يضيع دائماً في البيت وتقلب الدنيا تدوره وأنت مستعجل؟',
    answers: [
      { text: 'مفتاح السيارة / البيت', points: 38 },
      { text: 'المحفظة / بطاقة الصراف', points: 24 },
      { text: 'سماعة الأيربودز', points: 18 },
      { text: 'الجوال', points: 12 },
      { text: 'النظارة / الشماغ', points: 8 },
    ],
  },
  {
    id: 'ff_6',
    question: 'أول شيء يسويه الشخص أول ما ينزل الراتب أو المكافأة؟',
    answers: [
      { text: 'يسدد الديون / القطات', points: 33 },
      { text: 'يطلب من مطعم فخم', points: 26 },
      { text: 'يفلّل تانكي السيارة بنزين', points: 19 },
      { text: 'يتسوق أونلاين', points: 13 },
      { text: 'يحول لأهله', points: 9 },
    ],
  },
  {
    id: 'ff_7',
    question: 'أكثر شيء يحصل في مجلس الشباب وقت الكيف؟',
    answers: [
      { text: 'الضحكة على لا شيء', points: 35 },
      { text: 'منافسات لعبة كروت', points: 25 },
      { text: 'أحد ينام على الجلسة', points: 20 },
      { text: 'قصص من الماضي', points: 12 },
      { text: 'الجوال في يد الكل', points: 8 },
    ],
  },
  {
    id: 'ff_8',
    question: 'أكثر شيء يشتريه الشباب بالفيفا (EA Sports FC)؟',
    answers: [
      { text: 'الاعبين الذهب', points: 40 },
      { text: 'باقة تقاعد', points: 22 },
      { text: 'السوق السوداء', points: 18 },
      { text: 'البوكسات', points: 12 },
      { text: 'الباقة الشهرية', points: 8 },
    ],
  },
];

const usedQuestions = new Map<string, Set<string>>();
const buzzerLockTimers = new Map<string, NodeJS.Timeout>();

function getNextQuestion(roomCode: string) {
  const used = usedQuestions.get(roomCode) || new Set();
  const available = QUESTIONS.filter(q => !used.has(q.id));
  const pool = available.length > 0 ? available : QUESTIONS;
  const q = pool[Math.floor(Math.random() * pool.length)];
  used.add(q.id);
  usedQuestions.set(roomCode, used);
  return q;
}

export function startFamilyFeudGame(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  usedQuestions.set(roomCode, new Set());
  room.teams.A.score = 0;
  room.teams.B.score = 0;

  startRound(io, roomCode, 1);
}

function startRound(io: Server, roomCode: string, roundNumber: number): void {
  const room = getRoom(roomCode);
  if (!room) return;

  const q = getNextQuestion(roomCode);
  const answers: FeudAnswer[] = q.answers.map(a => ({
    text: a.text,
    points: a.points,
    revealed: false,
  }));

  const state: FamilyFeudState = {
    gameId: 'FAMILY_FEUD',
    subPhase: 'FACE_OFF',
    question: q.question,
    answers,
    multiplier: 1,
    buzzerLockedBy: null,
    buzzerLockedByName: null,
    buzzerLockedByTeam: null,
    controllingTeam: null,
    strikes: 0,
    roundPot: 0,
    roundNumber,
    maxRounds: 5,
  };

  room.gameState = state;
  room.phase = 'IN_GAME';
  io.to(roomCode).emit('room:state', room);
}

export function feudBuzz(io: Server, roomCode: string, deviceId: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  if (state.subPhase !== 'FACE_OFF' || state.buzzerLockedBy) return;

  const player = room.players[deviceId];
  if (!player) return;

  state.buzzerLockedBy = deviceId;
  state.buzzerLockedByName = player.name;
  state.buzzerLockedByTeam = player.team;

  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('sound:buzzer');
  io.to(roomCode).emit('feud:buzz_locked', {
    name: player.name,
    avatar: player.avatar,
    team: player.team,
  });
}

export function feudAssignControl(io: Server, roomCode: string, team: TeamId): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  state.controllingTeam = team;
  state.subPhase = 'TEAM_PLAY';
  state.strikes = 0;

  io.to(roomCode).emit('room:state', room);
}

export function feudRevealAnswer(io: Server, roomCode: string, answerIndex: number): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  const answer = state.answers[answerIndex];
  if (!answer || answer.revealed) return;

  answer.revealed = true;
  state.roundPot += answer.points * state.multiplier;

  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('sound:correct');
  io.to(roomCode).emit('feud:answer_revealed', { index: answerIndex, answer });

  // Check if all revealed
  if (state.answers.every(a => a.revealed)) {
    awardRoundPot(io, roomCode);
  }
}

export function feudStrike(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  state.strikes++;

  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('sound:strike');
  io.to(roomCode).emit('feud:strike', { strikes: state.strikes });

  if (state.strikes >= 3 && state.subPhase === 'TEAM_PLAY') {
    state.subPhase = 'STEAL_ATTEMPT';
    state.strikes = 0;
    io.to(roomCode).emit('room:state', room);
  }
}

export function feudStealAnswer(io: Server, roomCode: string, answerIndex: number): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  if (state.subPhase !== 'STEAL_ATTEMPT') return;

  const answer = state.answers[answerIndex];
  if (!answer || answer.revealed) return;

  answer.revealed = true;

  // Steal team gets the pot
  const stealTeam: TeamId = state.controllingTeam === 'A' ? 'B' : 'A';
  room.teams[stealTeam].score += state.roundPot + answer.points * state.multiplier;
  state.roundPot = 0;

  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('feud:steal_success', { team: stealTeam });
  io.to(roomCode).emit('sound:correct');

  goToReveal(io, roomCode);
}

export function feudStealMiss(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  if (state.subPhase !== 'STEAL_ATTEMPT') return;

  // Original controlling team keeps the pot
  if (state.controllingTeam) {
    room.teams[state.controllingTeam].score += state.roundPot;
    state.roundPot = 0;
  }

  io.to(roomCode).emit('sound:strike');
  goToReveal(io, roomCode);
}

function awardRoundPot(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  if (state.controllingTeam) {
    room.teams[state.controllingTeam].score += state.roundPot;
    state.roundPot = 0;
  }

  goToReveal(io, roomCode);
}

function goToReveal(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  state.subPhase = 'ROUND_REVEAL';
  io.to(roomCode).emit('room:state', room);
}

export function feudNextRound(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  const nextRound = state.roundNumber + 1;

  if (
    nextRound > state.maxRounds ||
    room.teams.A.score >= room.settings.targetWinScore ||
    room.teams.B.score >= room.settings.targetWinScore
  ) {
    endGame(io, roomCode);
    return;
  }

  startRound(io, roomCode, nextRound);
}

export function feudResetBuzzer(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'FAMILY_FEUD') return;

  const state = room.gameState as FamilyFeudState;
  state.buzzerLockedBy = null;
  state.buzzerLockedByName = null;
  state.buzzerLockedByTeam = null;
  state.subPhase = 'FACE_OFF';

  io.to(roomCode).emit('room:state', room);
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

export function cleanupFamilyFeud(roomCode: string): void {
  const timer = buzzerLockTimers.get(roomCode);
  if (timer) clearTimeout(timer);
  buzzerLockTimers.delete(roomCode);
  usedQuestions.delete(roomCode);
}
