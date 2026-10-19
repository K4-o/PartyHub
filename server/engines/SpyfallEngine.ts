import { Server } from 'socket.io';
import { RoomState, SpyfallState, TeamId } from '../types';
import { getRoom, getConnectedPlayers } from '../RoomManager';

interface SpyfallLocation {
  name: string;
  roles: string[];
}

interface SpyfallPack {
  category: string;
  locations: SpyfallLocation[];
}

const SPYFALL_PACKS: SpyfallPack[] = [
  {
    category: 'أماكن عامة ومشاوير',
    locations: [
      { name: 'صناعية السيارات', roles: ['الميكانيكي الفاهم', 'الزبون المصدوم من التكلفة', 'راعي السطحة', 'بياع قطع الغيار', 'كهربائي السيارات', 'عامل المخرطة'] },
      { name: 'صالة المطار الدولية', roles: ['الكابتن الطيار', 'المسافر اللي بتفوته الرحلة', 'موظف الجوازات', 'عامل العفش', 'مضيف الطيران', 'مسافر ضايع شنطته'] },
      { name: 'حراج السيارات', roles: ['الشريطي المخضرم', 'المشتري المتردد', 'فاحص البودي والصبغ', 'الدلال اللي يصرخ بالميكروفون', 'راعي الكشك', 'متفرج جاي يتفرج بس'] },
      { name: 'الحرم الجامعي وقت الاختبارات', roles: ['الدكتور المراقب', 'الطالب الدافور', 'الطالب اللي يذاكر قبل الاختبار بـ5 دقايق', 'رجل الأمن', 'عامل الكافتيريا', 'رئيس القسم'] },
      { name: 'استراحة شباب بالويكند', roles: ['الشيف حق العشاء', 'الحكم في صكة البلوت', 'اللي ماسك الجوال بالزاوية', 'راعي الاستراحة اللي يجمع القطة', 'بطل الفيفا', 'اللي جاي متأخر'] },
      { name: 'محل حلاقة ليلة العيد', roles: ['الحلاق التركي', 'الزبون اللي ينتظر من ساعتين', 'الطفل اللي يصيح', 'اللي جاي يحدد بس', 'محاسب المحل', 'زبون نائم على الكرسي'] },
      { name: 'قسم الطوارئ بالمستشفى', roles: ['طبيب المناوبة', 'الممرض السريع', 'مريض يدور إجازة مرضية', 'موظف الاستقبال', 'مرافق المريض القلقان', 'الصيدلي'] },
      { name: 'ملعب كرة قدم (تمرين حواري)', roles: ['الكابتن العصبي', 'الحارس اللي يتعذر بالكشافات', 'اللاعب المهاري اللي ما يناول', 'الحكم المتورط', 'راعي الكورة', 'الاحتياط اللي ينتظر دوره'] },
      { name: 'سوق الغنم', roles: ['البياع الخبير', 'الزبون اللي يكاسر بالسعر', 'راعي دينا التحميل', 'القصاب', 'الولد الصغير اللي يلاحق الخرفان', 'بياع الشعير والبرسيم'] },
      { name: 'مغسلة سيارات', roles: ['عامل الغسيل بمسدس الموية', 'المشرف اللي يحاسب', 'صاحب السيارة الجديدة الوسواس', 'اللي يلمع الكفرات', 'زبون يشرب شاهي بالانتظار'] },
      { name: 'مخيم شتوي في البر', roles: ['المسؤول عن شبة النار', 'راعي الدبابات', 'طباخ المندي', 'الحارس', 'الشخص اللي بردان ومتلحف ببطانيتين'] },
      { name: 'نادي رياضي (جيم)', roles: ['المدرب الشخصي (الكوتش)', 'المشترك الجديد أول يوم', 'اللي يصور قدام المراية', 'وحش الأوزان الثقيلة', 'موظف الاستقبال'] },
    ],
  },
];

const activeTimers = new Map<string, NodeJS.Timeout>();
const spyLastChanceTimers = new Map<string, NodeJS.Timeout>();

export function startSpyfallGame(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  const players = getConnectedPlayers(room);
  if (players.length < 2) return;

  // Reset individual scores
  Object.values(room.players).forEach(p => (p.score = 0));

  const pack = SPYFALL_PACKS[0];
  const location = pack.locations[Math.floor(Math.random() * pack.locations.length)];

  // Pick spy
  const spyPlayer = players[Math.floor(Math.random() * players.length)];

  // Assign roles
  const playerRoles: Record<string, string> = {};
  const shuffledRoles = [...location.roles].sort(() => Math.random() - 0.5);
  let roleIdx = 0;

  for (const player of players) {
    if (player.deviceId === spyPlayer.deviceId) {
      playerRoles[player.deviceId] = 'الجاسوس 🕵️';
    } else {
      playerRoles[player.deviceId] = shuffledRoles[roleIdx % shuffledRoles.length];
      roleIdx++;
    }
  }

  const allLocations = pack.locations.map(l => l.name);

  const state: SpyfallState = {
    gameId: 'SPYFALL',
    subPhase: 'ROLE_DISTRIBUTION',
    category: pack.category,
    secretLocation: location.name,
    allLocationsInCategory: allLocations,
    spyDeviceId: spyPlayer.deviceId,
    playerRoles,
    timeRemaining: 300,
    currentAskerId: players[0].deviceId,
    votes: {},
    accusedDeviceId: null,
    accusedName: null,
    spyGuessedLocation: null,
    winner: null,
    spyLastChanceTimeRemaining: 20,
  };

  room.gameState = state;
  room.phase = 'IN_GAME';
  io.to(roomCode).emit('room:state', room);
}

export function startSpyfallDiscussion(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'SPYFALL') return;

  const state = room.gameState as SpyfallState;
  state.subPhase = 'DISCUSSION';
  state.timeRemaining = 300;

  io.to(roomCode).emit('room:state', room);

  // Start countdown
  const timer = setInterval(() => {
    const r = getRoom(roomCode);
    if (!r || !r.gameState || r.gameState.gameId !== 'SPYFALL') {
      clearInterval(timer);
      return;
    }
    const s = r.gameState as SpyfallState;
    s.timeRemaining--;

    if (s.timeRemaining <= 0) {
      clearInterval(timer);
      activeTimers.delete(roomCode);
      startVoting(io, roomCode);
    } else {
      io.to(roomCode).emit('spyfall:tick', { timeRemaining: s.timeRemaining });
      if (s.timeRemaining <= 30) {
        io.to(roomCode).emit('sound:urgent_tick');
      }
    }
  }, 1000);

  activeTimers.set(roomCode, timer);
}

export function startVoting(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'SPYFALL') return;

  const timer = activeTimers.get(roomCode);
  if (timer) clearInterval(timer);
  activeTimers.delete(roomCode);

  const state = room.gameState as SpyfallState;
  state.subPhase = 'VOTING';
  state.votes = {};

  io.to(roomCode).emit('room:state', room);
}

export function spyfallVote(io: Server, roomCode: string, voterDeviceId: string, suspectedDeviceId: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'SPYFALL') return;

  const state = room.gameState as SpyfallState;
  if (state.subPhase !== 'VOTING') return;

  state.votes[voterDeviceId] = suspectedDeviceId;

  const connectedCount = getConnectedPlayers(room).length;
  const voteCount = Object.keys(state.votes).length;

  io.to(roomCode).emit('spyfall:vote_update', { votedCount: voteCount, totalCount: connectedCount });
  io.to(roomCode).emit('room:state', room);

  if (voteCount >= connectedCount) {
    resolveVotes(io, roomCode);
  }
}

function resolveVotes(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'SPYFALL') return;

  const state = room.gameState as SpyfallState;

  // Count votes
  const voteCounts: Record<string, number> = {};
  for (const v of Object.values(state.votes)) {
    voteCounts[v] = (voteCounts[v] || 0) + 1;
  }

  // Find most voted
  let maxVotes = 0;
  let accused = '';
  for (const [deviceId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      accused = deviceId;
    }
  }

  state.accusedDeviceId = accused;
  const accusedPlayer = room.players[accused];
  state.accusedName = accusedPlayer?.name || 'مجهول';

  if (accused !== state.spyDeviceId) {
    // Wrong person! Spy wins
    state.winner = 'SPY';
    const spy = room.players[state.spyDeviceId];
    if (spy) spy.score += 200;
    state.subPhase = 'ROUND_RESULT';
    io.to(roomCode).emit('room:state', room);
    setTimeout(() => endGame(io, roomCode), 4000);
  } else {
    // Spy caught! Give spy last chance
    state.subPhase = 'SPY_LAST_CHANCE';
    state.spyLastChanceTimeRemaining = 20;
    io.to(roomCode).emit('room:state', room);

    const timer = setTimeout(() => {
      // Spy didn't guess in time
      spyfallSpyGuess(io, roomCode, ''); // empty = forfeit
    }, 20000);
    spyLastChanceTimers.set(roomCode, timer);
  }
}

export function spyfallSpyGuess(io: Server, roomCode: string, guessedLocation: string): void {
  const room = getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.gameId !== 'SPYFALL') return;

  const timer = spyLastChanceTimers.get(roomCode);
  if (timer) clearTimeout(timer);
  spyLastChanceTimers.delete(roomCode);

  const state = room.gameState as SpyfallState;
  state.spyGuessedLocation = guessedLocation;

  const players = getConnectedPlayers(room);

  if (guessedLocation === state.secretLocation) {
    // Spy guesses right!
    state.winner = 'SPY';
    const spy = room.players[state.spyDeviceId];
    if (spy) spy.score += 150;
  } else {
    // Insiders win!
    state.winner = 'INSIDERS';
    for (const p of players) {
      if (p.deviceId !== state.spyDeviceId) {
        p.score += 100;
        // Bonus for voters who voted for spy
        if (state.votes[p.deviceId] === state.spyDeviceId) {
          p.score += 50;
        }
      }
    }
  }

  state.subPhase = 'ROUND_RESULT';
  io.to(roomCode).emit('room:state', room);
  setTimeout(() => endGame(io, roomCode), 4000);
}

function endGame(io: Server, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;
  room.phase = 'GAME_OVER';
  io.to(roomCode).emit('room:state', room);
  io.to(roomCode).emit('sound:victory');

  const state = room.gameState as SpyfallState | null;
  io.to(roomCode).emit('game:over', {
    teams: room.teams,
    players: room.players,
    winner: state?.winner || 'INSIDERS',
  });
}

export function cleanupSpyfall(roomCode: string): void {
  const t1 = activeTimers.get(roomCode);
  if (t1) clearInterval(t1);
  activeTimers.delete(roomCode);

  const t2 = spyLastChanceTimers.get(roomCode);
  if (t2) clearTimeout(t2);
  spyLastChanceTimers.delete(roomCode);
}
