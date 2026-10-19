// Frontend mirror of server types
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
  id: string;
  deviceId: string;
  name: string;
  avatar: string;
  team: TeamId;
  score: number;
  isConnected: boolean;
  isReady: boolean;
}

export interface TeamState {
  id: TeamId;
  name: string;
  color: string;
  score: number;
}

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
  auditorDeviceId: string;
  timeRemaining: number;
  currentCard: TabooCard | null;
  passesUsed: number;
  turnStats: {
    correctCount: number;
    passCount: number;
    violationCount: number;
    history: Array<{ word: string; outcome: 'CORRECT' | 'PASS' | 'VIOLATION' }>;
  };
  roundNumber: number;
  maxRounds: number;
}

export interface WavelengthCard {
  id: string;
  leftPole: string;
  rightPole: string;
  category: string;
}

export interface WavelengthState {
  gameId: 'WAVELENGTH';
  subPhase: 'PSYCHIC_CLUE' | 'TEAM_GUESS' | 'OPPONENT_STEAL' | 'REVEAL';
  activeTeam: TeamId;
  psychicDeviceId: string;
  card: WavelengthCard;
  clueText: string;
  targetCenter: number;
  teamDialValue: number;
  opponentPrediction: 'LEFT' | 'RIGHT' | null;
  stealTimeRemaining: number;
  lastRoundPoints: { activeTeamEarned: number; opponentTeamEarned: number };
  roundNumber: number;
  maxRounds: number;
}

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
  buzzerLockedBy: string | null;
  buzzerLockedByName: string | null;
  buzzerLockedByTeam: TeamId | null;
  controllingTeam: TeamId | null;
  strikes: number;
  roundPot: number;
  roundNumber: number;
  maxRounds: number;
}

export interface SpyfallState {
  gameId: 'SPYFALL';
  subPhase: 'ROLE_DISTRIBUTION' | 'DISCUSSION' | 'VOTING' | 'SPY_LAST_CHANCE' | 'ROUND_RESULT';
  category: string;
  secretLocation: string;
  allLocationsInCategory: string[];
  spyDeviceId: string;
  playerRoles: Record<string, string>;
  timeRemaining: number;
  currentAskerId: string;
  votes: Record<string, string>;
  accusedDeviceId: string | null;
  accusedName: string | null;
  spyGuessedLocation: string | null;
  winner: 'INSIDERS' | 'SPY' | null;
  spyLastChanceTimeRemaining: number;
}

export type GameState = TabooState | WavelengthState | FamilyFeudState | SpyfallState;

export interface RoomState {
  code: string;
  hostSocketId: string;
  lanIp: string;
  phase: RoomPhase;
  selectedGame: GameId | null;
  players: Record<string, Player>;
  teams: { A: TeamState; B: TeamState };
  settings: {
    roundDurationSeconds: number;
    targetWinScore: number;
    singleScreenMode: boolean;
  };
  gameState: GameState | null;
}
