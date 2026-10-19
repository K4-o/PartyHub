# MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Project: PartyHub — Arabic Real-Time Multiplayer Party Games Platform

## 1. SYSTEM VISION & EXECUTION DIRECTIVE FOR AI AGENT
You are tasked with building **PartyHub**, a complete, production-ready, bug-free, real-time multiplayer party gaming web platform designed for Arab youth gatherings (sessions/Majlis). 

**CRITICAL DIRECTIVES FOR AUTONOMOUS IMPLEMENTATION:**
1. **No Placeholders or TODOs:** Every game mode, socket handler, timer, scoring equation, sound effect, and UI screen must be 100% implemented and functional.
2. **Hybrid Playability (TV Host + Mobile Controllers AND Single-Screen Fallback):**
   - **Host Screen (`/host`):** Displayed on a TV or laptop. Renders the 4-letter Room Code, dynamic QR Code, global timer, scoreboard, game arena, and a collapsible **Host Control Bar** (allowing any game to also be operated directly from the Host screen if players choose not to use phones for a specific round).
   - **Mobile Controller (`/play`):** Scanned via QR code. Mobile-optimized vertical viewport (`100dvh`) with role-specific controls (Buzzers, Secret Role Cards, Interactive Sliders, Voting Grids).
3. **Zero Broken Assets (Procedural Web Audio API):** Do NOT rely on external `.mp3` files that might 404. Build a complete `SoundEngine.ts` using the browser's native `AudioContext` (Web Audio API) to synthesize rich, punchy sound effects: Game Show Buzzer, Strike Horn ($X$), Countdown Tick, Urgent Last-5-Seconds Beep, Card Flip Swoosh, Correct Ding, and Victory Fanfare.
4. **LAN IP Auto-Discovery for QR Codes:** Scanning `localhost` on a phone fails. The backend MUST inspect `os.networkInterfaces()` to detect the host machine's local LAN IPv4 address (e.g., `192.168.1.x`) and send it to the Host frontend so the QR code encodes `http://<LAN_IP>:<PORT>/play?room=XXXX`. Include an editable base-URL input on the Host Lobby as a manual override.
5. **Arabic-First RTL UX:** Default direction is `dir="rtl"`, language `ar`, using Google Font `'Readex Pro'` or `'Cairo'`, with a vibrant, high-contrast dark gaming aesthetic (`slate-950` canvas, neon emerald, amber, violet, and crimson accents).

---

## 2. TECHNICAL STACK & ARCHITECTURE

### 2.1 Core Stack
- **Frontend:** React 18/19 + TypeScript + Vite + Tailwind CSS + Framer Motion + `lucide-react` + `qrcode.react` + `canvas-confetti` + `zustand`.
- **Backend:** Node.js + Express + `socket.io` + TypeScript (`tsx` for execution).
- **Development Workflow:** Single root `package.json` or unified workspace using `concurrently` so running `npm run dev` boots both the Vite server (port `5173`, `--host 0.0.0.0`) and the Express/Socket.io server (port `3001`, bound to `0.0.0.0`).

### 2.2 Project Directory Structure
~~~text
partyhub/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── server/
│   ├── index.ts                 # Express + Socket.io Server + LAN IP endpoint
│   ├── types.ts                 # Shared TypeScript interfaces & contracts
│   ├── RoomManager.ts           # Room lifecycle, reconnection, team balancing
│   └── engines/
│       ├── TabooEngine.ts       # Game 1: قول بس لا تقول
│       ├── WavelengthEngine.ts  # Game 2: الطول الموجي
│       ├── FamilyFeudEngine.ts  # Game 3: ستيف هارفي
│       └── SpyfallEngine.ts     # Game 4: برّا السالفة
└── src/
    ├── main.tsx
    ├── App.tsx                  # Route handler (Landing, /host, /play)
    ├── index.css                # Tailwind + RTL + Custom Scrollbars/Animations
    ├── types/
    │   └── game.ts              # Frontend mirror of server types
    ├── utils/
    │   ├── SoundEngine.ts       # Web Audio API synthesizer (100% dependency-free SFX)
    │   └── haptics.ts           # navigator.vibrate wrapper
    ├── data/
    │   ├── tabooData.ts         # 25+ rich Arabic Taboo cards
    │   ├── wavelengthData.ts    # 25+ Arabic Wavelength spectrum pairs
    │   ├── familyFeudData.ts    # 15+ Arabic Family Feud survey questions
    │   └── spyfallData.ts       # 20+ Arabic locations with custom roles
    ├── store/
    │   └── usePartyStore.ts     # Zustand store synced with Socket.io
    └── components/
        ├── shared/
        │   ├── CircularTimer.tsx
        │   ├── ScoreBanner.tsx
        │   ├── TeamBadge.tsx
        │   └── HostOverrideDrawer.tsx
        ├── host/
        │   ├── HostView.tsx
        │   ├── HostLobby.tsx
        │   ├── games/
        │   │   ├── TabooHost.tsx
        │   │   ├── WavelengthHost.tsx
        │   │   ├── FamilyFeudHost.tsx
        │   │   └── SpyfallHost.tsx
        └── controller/
            ├── ControllerView.tsx
            ├── ControllerJoin.tsx
            ├── ControllerLobby.tsx
            └── games/
                ├── TabooController.tsx
                ├── WavelengthController.tsx
                ├── FamilyFeudController.tsx
                └── SpyfallController.tsx
~~~

---

## 3. AUTHORITATIVE DATA MODELS & STATE CONTRACTS (`server/types.ts`)

~~~typescript
export type GameId = 'TABOO' | 'WAVELENGTH' | 'FAMILY_FEUD' | 'SPYFALL';

export type RoomPhase = 
  | 'LOBBY' 
  | 'GAME_SELECT' 
  | 'RULES_PREVIEW' 
  | 'IN_GAME' 
  | 'ROUND_SUMMARY' 
  | 'GAME_OVER';

export type TeamId = 'A' | 'B';

export interface Player {
  id: string;              // Current Socket ID
  deviceId: string;        // Persistent UUID in client localStorage for seamless reconnects
  name: string;
  avatar: string;          // Emoji avatar (e.g., "🦁", "🦅", "🦊", "🐯", "🥷", "🤖")
  team: TeamId;
  score: number;           // Individual score (used in Spyfall)
  isConnected: boolean;
  isReady: boolean;
}

export interface TeamState {
  id: TeamId;
  name: string;            // Default: "فريق الصقور" (A) vs "فريق الذئاب" (B)
  color: string;           // Emerald vs Violet
  score: number;
}

export interface RoomState {
  code: string;            // 4-char uppercase code (excluding I, O, 0, 1 for readability)
  hostSocketId: string;
  lanIp: string;           // Detected LAN IP for QR generation
  phase: RoomPhase;
  selectedGame: GameId | null;
  players: Record<string, Player>; // Keyed by deviceId for reconnect resilience
  teams: { A: TeamState; B: TeamState };
  settings: {
    roundDurationSeconds: number;
    targetWinScore: number;
    singleScreenMode: boolean; // Allows playing without phones if toggled on Host
  };
  gameState: TabooState | WavelengthState | FamilyFeudState | SpyfallState | null;
}
~~~

---

## 4. COMPLETE GAME LOGIC & STATE MACHINES

Every game MUST implement a strict, deterministic state machine on the backend and render responsive, animated interfaces on both `/host` and `/play`.

---

### GAME 1: "قول بس لا تقول" (Taboo / Forbidden Words)

#### 4.1.1 State Interface
~~~typescript
export interface TabooCard {
  id: string;
  word: string;
  category: string;
  forbidden: [string, string, string, string, string];
}

export interface TabooState {
  gameId: 'TABOO';
  subPhase: 'TURN_READY' | 'DESCRIBING' | 'TURN_SUMMARY';
  activeTeam: TeamId;
  describerDeviceId: string;
  auditorDeviceId: string; // Player from opposing team watching for forbidden words
  timeRemaining: number;
  currentCard: TabooCard | null;
  turnStats: {
    correctCount: number;
    passCount: number;
    violationCount: number;
    history: Array<{ word: string; outcome: 'CORRECT' | 'PASS' | 'VIOLATION' }>;
  };
  roundNumber: number;
}
~~~

#### 4.1.2 Gameplay Rules & Edge Cases
1. **Role Assignment (`TURN_READY`):**
   - Server selects `activeTeam` (alternates A and B).
   - Server rotates `describerDeviceId` among connected members of `activeTeam`.
   - Server assigns `auditorDeviceId` from the opposing team (if fewer than 2 players are connected, or if `singleScreenMode` is active, Host controls remain unlocked).
2. **Active Turn (`DESCRIBING`):**
   - 60-second server interval ticks down `timeRemaining` every second.
   - **Host UI:** Shows massive animated timer, active team banner, current Describer name, current score counter, and a blurred/hidden card placeholder (so the guessing team looking at the TV cannot see the word, UNLESS the Host flips a "Show Card on TV" toggle for single-device play).
   - **Describer Mobile UI:** Displays the `currentCard.word` in giant bold typography, the 5 `forbidden` words in red warning pills, a huge green button **"صح (+1 نقطة)"**, and a yellow button **"تخطي (باقي 2)"** (Max 3 passes per turn).
   - **Auditor Mobile UI (Opposing Team):** Displays the exact same `currentCard` so they can monitor the Describer, plus a giant pulsing red button **"مخالفة! قال الكلمة (-1)"**.
   - **Guessing Team Mobile UI:** Displays "ركّز مع خويك وخلّك سريع في التخمين! 🔥" with live score counter.
3. **Scoring & Transitions:**
   - `CORRECT`: $+1$ to `activeTeam.score`, play ding sound, draw next card immediately.
   - `PASS`: $0$ points (up to 3 times per turn), play swoosh sound, draw next card.
   - `VIOLATION`: $-1$ to `activeTeam.score` (minimum 0), trigger red screen flash and buzzer horn on TV, draw next card.
   - When `timeRemaining == 0`: Play airhorn, transition to `TURN_SUMMARY` showing all words attempted in that turn, with a button for the Host to toggle/correct any accidental clicks before starting the next team's turn.

---

### GAME 2: "الطول الموجي" (Wavelength)

#### 4.2.1 State Interface
~~~typescript
export interface WavelengthCard {
  id: string;
  leftPole: string;   // corresponds to 0
  rightPole: string;  // corresponds to 100
  category: string;
}

export interface WavelengthState {
  gameId: 'WAVELENGTH';
  subPhase: 'PSYCHIC_CLUE' | 'TEAM_GUESS' | 'OPPONENT_STEAL' | 'REVEAL';
  activeTeam: TeamId;
  psychicDeviceId: string;
  card: WavelengthCard;
  clueText: string;            // Optional typed clue or verbal confirmation
  targetCenter: number;        // Random integer between 12 and 88
  teamDialValue: number;       // 0 to 100 (default 50)
  opponentPrediction: 'LEFT' | 'RIGHT' | null; // Opposing team bets if target is to the left or right of teamDialValue
  lastRoundPoints: { activeTeamEarned: number; opponentTeamEarned: number };
  roundNumber: number;
}
~~~

#### 4.2.2 Gameplay Rules & Exact Scoring Math
1. **Psychic Phase (`PSYCHIC_CLUE`):**
   - Server generates `targetCenter` randomly between `12` and `88` and picks a `WavelengthCard`.
   - **Host UI:** Displays the semicircular 180° gauge with the target shutter **CLOSED**, showing the two spectrum poles (`leftPole` at 0°, `rightPole` at 180°).
   - **Psychic Mobile UI:** Renders a private semicircular gauge showing the exact location of the `targetCenter` and its colored scoring wedges! Includes an optional text input ("اكتب التلميح أو قله بصوتك") and a button **"أعطيت التلميح - ابدأ التخمين"**.
2. **Team Guess Phase (`TEAM_GUESS`):**
   - Active team members (except the Psychic) get an interactive dial/slider (`0` to `100`) on their phones (and on Host screen).
   - Moving the slider emits `wavelength:move_dial` (throttled to 30ms), smoothly rotating the needle on the Host TV screen in real time with subtle mechanical tick sounds.
   - Active team clicks **"تثبيت المؤشر (Lock In)"**.
3. **Opponent Steal Phase (`OPPONENT_STEAL`):**
   - Before opening the shutter, the opposing team gets 20 seconds to vote on their phones (or tell the Host): **"هل الهدف الحقيقي يمين أم يسار المؤشر؟"** (`LEFT` meaning $< \text{teamDialValue}$, `RIGHT` meaning $> \text{teamDialValue}$).
4. **Dramatic Reveal Phase (`REVEAL`):**
   - **Host UI:** Animates the shutter sliding open over 1.5 seconds with a drumroll, revealing the colored target zones alongside the locked needle!
   - **Exact Scoring Equation (`diff = Math.abs(targetCenter - teamDialValue)`):**
     - **Bullseye (4 Points):** `diff <= 3` (Dark Emerald center wedge)
     - **Inner Ring (3 Points):** `diff > 3 && diff <= 9` (Amber inner wedges)
     - **Outer Ring (2 Points):** `diff > 9 && diff <= 15` (Cyan outer wedges)
     - **Miss (0 Points):** `diff > 15`
   - **Opponent Bonus:** If `diff > 3` (not a bullseye) AND the opposing team correctly guessed the direction (`LEFT` when `targetCenter < teamDialValue`, or `RIGHT` when `targetCenter > teamDialValue`), the opposing team earns **$+1$ Steal Point**!

---

### GAME 3: "ستيف هارفي" (Family Feud / حرب العائلات)

#### 4.3.1 State Interface
~~~typescript
export interface FeudAnswer {
  text: string;
  points: number;
  revealed: boolean;
}

export interface FamilyFeudState {
  gameId: 'FAMILY_FEUD';
  subPhase: 'FACE_OFF' | 'TEAM_PLAY' | 'STEAL_ATTEMPT' | 'ROUND_REVEAL';
  question: string;
  answers: FeudAnswer[];
  multiplier: 1 | 2 | 3;
  buzzerLockedBy: string | null; // deviceId of fastest buzzer
  ControllingTeam: TeamId | null;
  strikes: number;               // 0, 1, 2, or 3
  roundPot: number;              // Accumulated points in current board
  roundNumber: number;
}
~~~

#### 4.3.2 Gameplay Rules & Host Control Surface
1. **Face-Off Buzzer Race (`FACE_OFF`):**
   - **Host UI:** Displays the survey question at the top and 5–8 numbered blue flip-panels (`1` through `N`) in a classic TV game show grid.
   - **Player Controllers:** Display a massive, glowing **"اضغط الجرس! 🔔"** button.
   - **Server Resolution:** The first player to emit `feud:buzz` locks the buzzer (`buzzerLockedBy`), plays a sharp game-show chime on the TV, and displays that player's avatar and team banner prominently on the TV.
   - Host can click **"إعادة فتح الجرس"** if the first player answers lower than the #1 answer and the other team gets a chance, then assigns control to `Team A` or `Team B` (`TEAM_PLAY`).
2. **Main Board & Host Admin Panel (`TEAM_PLAY`):**
   - Since verbal answers in a living room are judged by the group/Host, both the **Host Screen** (via a sleek bottom control bar) AND whoever is designated as **Game Master** see clickable answer buttons labeled with the secret answers (or a toggleable "Reveal Host Key on Phone" mode).
   - Clicking an answer flips the corresponding 3D card on the TV screen, plays the classic ding sound, and adds `answer.points * multiplier` to `roundPot`.
   - Clicking **"خطأ (Strike X)"** increments `strikes`, flashes a giant red **[ X ]**, **[ X X ]**, or **[ X X X ]** overlay across the center of the TV screen, and blasts the loud error horn!
3. **Steal Mechanic (`STEAL_ATTEMPT`):**
   - When `strikes === 3`, the turn automatically shifts to `STEAL_ATTEMPT` for the opposing team!
   - If the opposing team guesses any remaining unrevealed answer on the board (Host clicks that answer), they **STEAL the entire `roundPot`**!
   - If they miss (Host clicks Strike), the original `ControllingTeam` keeps the `roundPot`.
4. **Post-Round (`ROUND_REVEAL`):**
   - Remaining unrevealed cards can be flipped open for fun without adding to the pot before advancing to the next question.

---

### GAME 4: "برّا السالفة" (Spyfall / Social Deduction)

#### 4.4.1 State Interface
~~~typescript
export interface SpyfallState {
  gameId: 'SPYFALL';
  subPhase: 'ROLE_DISTRIBUTION' | 'DISCUSSION' | 'VOTING' | 'SPY_LAST_CHANCE' | 'ROUND_RESULT';
  category: string;
  secretLocation: string;
  allLocationsInCategory: string[]; // 12 locations shown on screen so the Spy has a reference
  spyDeviceId: string;
  playerRoles: Record<string, string>; // deviceId -> role title (or "SPY")
  timeRemaining: number;               // 300 seconds (5 mins)
  currentAskerId: string;              // Suggests who starts asking
  votes: Record<string, string>;       // voterDeviceId -> suspectedDeviceId
  accusedDeviceId: string | null;
  spyGuessedLocation: string | null;
  winner: 'INSIDERS' | 'SPY' | null;
}
~~~

#### 4.4.2 Gameplay Rules & Anti-Peek Security
1. **Role Distribution (`ROLE_DISTRIBUTION`):**
   - Server randomly selects 1 connected player as `spyDeviceId`. All other players receive `secretLocation` and a unique humorous role (e.g., Location: `صناعية السيارات`, Roles: `الميكانيكي الفاهم`, `الزبون المصدوم من السعر`, `راعي السطحة`, `بياع قطع الغيار`).
   - **Mobile Controller Security:** Displays a locked privacy card: **"اضغط مطولاً لكشف بطاقتك السرية 🕵️‍♂️"** (`onPointerDown` reveals, `onPointerUp` / `onPointerLeave` immediately blurs/hides).
   - **Single-Screen Pass-and-Play Fallback:** If `singleScreenMode` is active, the Host screen walks through players one by one ("سلّم الجهاز لـ [اسم اللاعب] ثم اضغط لكشف الدور").
2. **Discussion & Reference Matrix (`DISCUSSION`):**
   - **Host UI:** Shows the 5-minute countdown timer, an indicator of who asks the first question, and a visual grid of all 12 possible locations in the current category so the Spy can look at the TV without looking suspicious!
   - **Mobile Controller:** Keeps the Hold-to-Reveal role card at the top, a tap-to-cross-out checklist of the 12 locations, and a **"بدء التصويت الآن"** button.
3. **Voting (`VOTING`):**
   - Every player taps the name/avatar of who they suspect is "برّا السالفة" on their phone.
   - Host screen shows live checkmarks of who has voted without revealing their choices until all votes are in.
4. **Spy's Last Chance (`SPY_LAST_CHANCE`):**
   - Reveal the voted suspect (`accusedDeviceId`) with dramatic tension.
   - **Case A (Wrong Person Accused):** The Spy wins immediately! (`+200 pts` to Spy).
   - **Case B (The Spy WAS Caught!):** The game is NOT over yet! Transition to `SPY_LAST_CHANCE`. The caught Spy gets **20 seconds** on their phone (or verbally via Host) to select the true `secretLocation` from the list of 12 locations.
     - If the Spy guesses the location right: **Spy steals the victory!** (`+150 pts` to Spy).
     - If the Spy guesses wrong: **Insiders win!** (`+100 pts` to every Insider, $+50$ bonus to players who voted for the Spy).

---

## 5. PROCEDURAL WEB AUDIO ENGINE SPECIFICATION (`src/utils/SoundEngine.ts`)

Implement a singleton class `SoundEngine` using `window.AudioContext || window.webkitAudioContext`. Include a global Mute/Unmute toggle on the Host header.

Required synthesized methods:
1. `playTick(urgent?: boolean)`: Short sine/triangle blip (`800Hz` normal, `1200Hz` if `urgent`, `60ms` duration).
2. `playCorrect()`: Cheerful major triad arpeggio (`C5 -> E5 -> G5 -> C6`, triangle wave with smooth exponential decay).
3. `playStrike()`: Iconic harsh game-show error buzzer (dual detuned sawtooth oscillators at `110Hz` and `116Hz` with low-pass filter, `650ms` duration).
4. `playBuzzer()`: Fast, bright competitive lock-in chime (`880Hz -> 1320Hz`, square/triangle blend).
5. `playFlip()`: Crisp high-pass noise burst or rapid frequency sweep (`300Hz -> 900Hz` in `90ms`) simulating a board panel flipping.
6. `playVictory()`: Celebratory 5-note brassy synth fanfare triggered alongside `canvas-confetti`.

---

## 6. RICH ARABIC CONTENT DATA BANKS (`src/data/`)

Populate the data files with **at least the following authentic Saudi/Gulf youth items** (and expand each array to 20+ items during implementation):

### 6.1 `tabooData.ts` (قول بس لا تقول)
~~~typescript
export const TABOO_CARDS = [
  { id: "tb_1", word: "مندي", category: "أكلات", forbidden: ["رز", "لحم", "دجاج", "حفرة", "برميل"] },
  { id: "tb_2", word: "استراحة", category: "طلعات", forbidden: ["شباب", "إيجار", "مسبح", "بلوت", "ويكند"] },
  { id: "tb_3", word: "البيك", category: "مطاعم", forbidden: ["مسحب", "ثوم", "بروست", "جدة", "زحمة"] },
  { id: "tb_4", word: "ساهر", category: "الشارع", forbidden: ["كاميرا", "مخالفة", "سرعة", "فلاش", "مرور"] },
  { id: "tb_5", word: "بلوت", category: "ألعاب", forbidden: ["ورق", "صن", "حكم", "مشاريع", "أربعة"] },
  { id: "tb_6", word: "كشتة", category: "طلعات", forbidden: ["بر", "خيمة", "شبة ضو", "شتاء", "طعوس"] },
  { id: "tb_7", word: "شاورما", category: "أكلات", forbidden: ["ثوم", "سيخ", "خبز", "دجاج", "مخلل"] },
  { id: "tb_8", word: "بنشري", category: "سيارات", forbidden: ["كفر", "زيت", "رقعة", "هواء", "محطة"] },
  { id: "tb_9", word: "مناقشة تخرج", category: "جامعة", forbidden: ["مشروع", "دكتور", "عرض", "بحث", "درجة"] },
  { id: "tb_10", word: "قهوة سعودية", category: "مشروبات", forbidden: ["هيل", "دلة", "فنجال", "تمر", "زعفران"] },
  { id: "tb_11", word: "حلاق", category: "حياة يومية", forbidden: ["شعر", "دقن", "موس", "مقص", "نعيماً"] },
  { id: "tb_12", word: "تطبيق هنقرستيشن", category: "تطبيقات", forbidden: ["توصيل", "مطعم", "مندوب", "طلب", "أصفر"] },
  { id: "tb_13", word: "ثوب العيد", category: "مناسبات", forbidden: ["خياط", "مقاس", "جديد", "شماغ", "رمضان"] },
  { id: "tb_14", word: "بطارية الجوال", category: "تقنية", forbidden: ["شاحن", "نسبة", "طفا", "باوربانك", "كهرباء"] },
  { id: "tb_15", word: "خط سفر", category: "سفر", forbidden: ["سيارة", "مثبت سرعة", "محطة", "طريق", "مسافة"] },
  { id: "tb_16", word: "عريكة", category: "أكلات", forbidden: ["جنوب", "سمن", "عسل", "بر", "تمر"] },
  { id: "tb_17", word: "بلايستيشن", category: "ألعاب", forbidden: ["يد", "سوني", "فيفا", "شاشة", "أونلاين"] },
  { id: "tb_18", word: "تفتيش", category: "الشارع", forbidden: ["شرطة", "نقطة", "رخصة", "استمارة", "اثبات"] },
  { id: "tb_19", word: "عزيمة عشاء", category: "مناسبات", forbidden: ["ضيوف", "ذبيحة", "مجلس", "كرم", "تفضلوا"] },
  { id: "tb_20", word: "مكيف سبلت", category: "أجهزة", forbidden: ["حار", "بارد", "ريموت", "فريون", "صيف"] }
];
~~~

### 6.2 `wavelengthData.ts` (الطول الموجي)
~~~typescript
export const WAVELENGTH_CARDS = [
  { id: "wl_1", leftPole: "مطعم رخيص ويسد الجوع", rightPole: "مطعم غالي وما يشبع", category: "مطاعم" },
  { id: "wl_2", leftPole: "عادة سيئة جداً", rightPole: "عادة صحية ومثالية", category: "أسلوب حياة" },
  { id: "wl_3", leftPole: "فيلم يرفع الضغط وممل", rightPole: "تحفة سينمائية تاريخية", category: "أفلام" },
  { id: "wl_4", leftPole: "سيارة اعتمادية ما تطلب قطع", rightPole: "سيارة كل أسبوع بالصناعية", category: "سيارات" },
  { id: "wl_5", leftPole: "شخصية هادية ومسالمة", rightPole: "شخصية تدور المشاكل", category: "شخصيات" },
  { id: "wl_6", leftPole: "تطبيق ما تقدر تعيش بدونه", rightPole: "تطبيق ما له أي فايدة بجوالك", category: "تقنية" },
  { id: "wl_7", leftPole: "عذر مقنع لما تتأخر", rightPole: "كذبة مكشوفة محد يصدقها", category: "مواقف" },
  { id: "wl_8", leftPole: "أكلة ثقيلة تجيب النوم", rightPole: "أكلة خفيفة وصحية", category: "أكلات" },
  { id: "wl_9", leftPole: "مادة جامعية سهلة (مضمونة A+)", rightPole: "مادة معقدة وتجيب الصداع", category: "دراسة" },
  { id: "wl_10", leftPole: "هدية تفرح القلب", rightPole: "هدية تسليكية مالها داعي", category: "مناسبات" },
  { id: "wl_11", leftPole: "مدينة جوها خيالي وبارد", rightPole: "مدينة حر ورطوبة لا تطاق", category: "سفر" },
  { id: "wl_12", leftPole: "لعبة تزيد المحبة بين الأصحاب", rightPole: "لعبة تفرق الشلة وتسبب هواش", category: "ألعاب" },
  { id: "wl_13", leftPole: "مهارة مفيدة جداً بالحياة", rightPole: "مهارة استعراضية مالها فايدة", category: "مهارات" },
  { id: "wl_14", leftPole: "صوت مريح للأعصاب", rightPole: "صوت يوتر ويجيب القلق", category: "حواس" },
  { id: "wl_15", leftPole: "قرار مالي ذكي", rightPole: "تضييع فلوس على الفاضي", category: "مال" }
];
~~~

### 6.3 `familyFeudData.ts` (ستيف هارفي)
~~~typescript
export const FAMILY_FEUD_QUESTIONS = [
  {
    id: "ff_1",
    question: "شيء يتفقدونه الشباب أول ما يركبون السيارة قبل ما يمشون؟",
    answers: [
      { text: "الجوال / سلك الشاحن", points: 35 },
      { text: "المكيف", points: 24 },
      { text: "البنزين / العداد", points: 18 },
      { text: "المرايات", points: 13 },
      { text: "البلوتوث / الصوت", points: 10 }
    ]
  },
  {
    id: "ff_2",
    question: "أشهر عذر يقوله الطالب للدكتور إذا دخل القاعة متأخر؟",
    answers: [
      { text: "زحمة الطريق / حادث", points: 40 },
      { text: "ما لقيت موقف بالجامعة", points: 25 },
      { text: "السيارة تعطلت / بنشرت", points: 16 },
      { text: "كنت مضيع القاعة", points: 11 },
      { text: "المنبه ما دق / راحت علي نومة", points: 8 }
    ]
  },
  {
    id: "ff_3",
    question: "شيء مستحيل تكتمل الكشتة أو الطلعة للبر بدونه؟",
    answers: [
      { text: "الحطب / شبة الضو", points: 34 },
      { text: "القهوة والشاهي (العزبة)", points: 28 },
      { text: "الفرشة / الجلسة", points: 16 },
      { text: "العشاء / اللحم والدجاج", points: 14 },
      { text: "ورق البلوت", points: 8 }
    ]
  },
  {
    id: "ff_4",
    question: "أكثر جملة تسمعها إذا اتفقتوا تطلعون مع الشباب؟",
    answers: [
      { text: "وين نروح / وش نتعشى؟", points: 36 },
      { text: "أنا بالطريق (وهو باقي بالبيت)", points: 27 },
      { text: "مرّوني ما معي سيارة", points: 17 },
      { text: "قطّوا / حاسبوا عني وأحول لكم", points: 12 },
      { text: "احجزوا لنا مكان", points: 8 }
    ]
  },
  {
    id: "ff_5",
    question: "شيء يضيع دائماً في البيت وتقلب الدنيا تدوره وأنت مستعجل؟",
    answers: [
      { text: "مفتاح السيارة / البيت", points: 38 },
      { text: "المحفظة / بطاقة الصراف", points: 24 },
      { text: "سماعة الأيربودز", points: 18 },
      { text: "الجوال", points: 12 },
      { text: "النظارة / الشماغ", points: 8 }
    ]
  },
  {
    id: "ff_6",
    question: "أول شيء يسويه الشخص أول ما ينزل الراتب أو المكافأة؟",
    answers: [
      { text: "يسدد الديون / القطات", points: 33 },
      { text: "يطلب من مطعم فخم", points: 26 },
      { text: "يفلّل تانكي السيارة بنزين", points: 19 },
      { text: "يتسوق أونلاين", points: 13 },
      { text: "يحول لأهله", points: 9 }
    ]
  }
];
~~~

### 6.4 `spyfallData.ts` (برّا السالفة)
~~~typescript
export const SPYFALL_PACKS = [
  {
    category: "أماكن عامة ومشاوير",
    locations: [
      {
        name: "صناعية السيارات",
        roles: ["الميكانيكي الفاهم", "الزبون المصدوم من التكلفة", "راعي السطحة", "بياع قطع الغيار", "كهربائي السيارات", "عامل المخرطة"]
      },
      {
        name: "صالة المطار الدولية",
        roles: ["الكابتن الطيار", "المسافر اللي بتفوته الرحلة", "موظف الجوازات", "عامل العفش", "مضيف الطيران", "مسافر ضايع شنطته"]
      },
      {
        name: "حراج السيارات",
        roles: ["الشريطي المخضرم", "المشتري المتردد", "فاحص البودي والصبغ", "الدلال اللي يصرخ بالميكروفون", "راعي الكشك", "متفرج جاي يتفرج بس"]
      },
      {
        name: "الحرم الجامعي وقت الاختبارات",
        roles: ["الدكتور المراقب", "الطالب الدافور", "الطالب اللي يذاكر قبل الاختبار بـ5 دقايق", "رجل الأمن", "عامل الكافتيريا", "رئيس القسم"]
      },
      {
        name: "استراحة شباب بالويكند",
        roles: ["الشيف حق العشاء", "الحكم في صكة البلوت", "اللي ماسك الجوال بالزاوية", "راعي الاستراحة اللي يجمع القطة", "بطل الفيفا", "اللي جاي متأخر"]
      },
      {
        name: "محل حلاقة ليلة العيد",
        roles: ["الحلاق التركي", "الزبون اللي ينتظر من ساعتين", "الطفل اللي يصيح", "اللي جاي يحدد بس", "محاسب المحل", "زبون نائم على الكرسي"]
      },
      {
        name: "قسم الطوارئ بالمستشفى",
        roles: ["طبيب المناوبة", "الممرض السريع", "مريض يدور إجازة مرضية", "موظف الاستقبال", "مرافق المريض القلقان", "الصيدلي"]
      },
      {
        name: "ملعب كرة قدم (تمرين حواري)",
        roles: ["الكابتن العصبي", "الحارس اللي يتعذر بالكشافات", "اللاعب المهاري اللي ما يناول", "الحكم المتورط", "راعي الكورة", "الاحتياط اللي ينتظر دوره"]
      },
      {
        name: "سوق الغنم",
        roles: ["البياع الخبير", "الزبون اللي يكاسر بالسعر", "راعي دينا التحميل", "القصاب", "الولد الصغير اللي يلاحق الخرفان", "بياع الشعير والبرسيم"]
      },
      {
        name: "مغسلة سيارات",
        roles: ["عامل الغسيل بمسدس الموية", "المشرف اللي يحاسب", "صاحب السيارة الجديدة الوسواس", "اللي يلمع الكفرات", "زبون يشرب شاهي بالانتظار"]
      },
      {
        name: "مخيم شتوي في البر",
        roles: ["المسؤول عن شبة النار", "راعي الدبابات", "طباخ المندي", "الحارس", "الشخص اللي بردان ومتلحف ببطانيتين"]
      },
      {
        name: "نادي رياضي (جيم)",
        roles: ["المدرب الشخصي (الكوتش)", "المشترك الجديد أول يوم", "اللي يصور قدام المراية", "وحش الأوزان الثقيلة", "موظف الاستقبال"]
      }
    ]
  }
];
~~~

---

## 7. UI/UX & RESPONSIVE DESIGN SPECIFICATIONS

### 7.1 Landing & Navigation (`/`)
- Clean hero screen with two prominent action cards:
  1. **"شاشة العرض الرئيسية (تلفزيون / لابتوب)"** $\to$ navigates to `/host` and creates a room.
  2. **"الانضمام بجوالك كلاعب"** $\to$ navigates to `/play` with a 4-letter Room Code input.

### 7.2 Host Screen (`/host`)
- **Top Utility Bar:**
  - Displays Room Code in large glowing badge (`كود الغرفة: KSA9`).
  - Mini QR button (hover/click expands the QR code modal anytime mid-game if a friend arrives late!).
  - Connected Players Pill showing avatars and online indicators.
  - **"وضع الشاشة الواحدة (تحكم مباشر)"** toggle switch: unlocks all game controls directly on the TV screen so any game can be played either via phones OR directly on the Host device.
  - Mute/Unmute Sound Engine button & "تغيير اللعبة (Switch Game)" button.

### 7.3 Mobile Controller (`/play`)
- Reads `?room=XXXX` query param automatically so scanning the QR code skips typing the room code!
- Saves `deviceId`, `name`, and `avatar` in `localStorage`. If a player refreshes their browser or temporarily locks their phone, they automatically rejoin their exact seat and role without losing state.
- Uses `h-dvh overflow-hidden select-none` so fast tapping on buzzers or holding secret cards never triggers unwanted mobile browser zooming or text selection.

---

## 8. EXECUTION & SELF-VERIFICATION PLAN FOR ANTIGRAVITY

Execute the build in the following sequence and do not stop until Step 5 passes:

1. **Step 1 (Setup & Infrastructure):** Initialize project, install dependencies (`socket.io`, `socket.io-client`, `framer-motion`, `lucide-react`, `qrcode.react`, `canvas-confetti`, `zustand`, `concurrently`, `tsx`), and configure Tailwind with RTL support and Arabic Google Fonts.
2. **Step 2 (Backend & Engines):** Build `server/index.ts`, `RoomManager.ts`, and all 4 authoritative game engines (`TabooEngine`, `WavelengthEngine`, `FamilyFeudEngine`, `SpyfallEngine`) with LAN IP auto-detection.
3. **Step 3 (Audio & Data):** Implement `SoundEngine.ts` (Web Audio API synthesizer) and populate all 4 rich Arabic data banks in `src/data/`.
4. **Step 4 (Frontend Host & Controller Views):** Build `/host` and `/play` views for Lobby and all 4 games with smooth Framer Motion transitions and Host Override controls.
5. **Step 5 (Autonomous Browser-in-the-Loop Verification):**
   - Start both backend and frontend servers (`npm run dev`).
   - Open `/host` in the integrated browser, verify room creation and QR code rendering.
   - Open `/play?room=<CODE>` in a second browser context, join as two players, and test launching each of the 4 games (`TABOO`, `WAVELENGTH`, `FAMILY_FEUD`, `SPYFALL`).
   - Verify zero console errors, smooth state synchronization, working timers, and accurate score updates.