import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';
import { usePartyStore } from '../../store/usePartyStore';
import ControllerJoin from './ControllerJoin';
import ControllerLobby from './ControllerLobby';
import TabooController from './games/TabooController';
import WavelengthController from './games/WavelengthController';
import FamilyFeudController from './games/FamilyFeudController';
import SpyfallController from './games/SpyfallController';

export default function ControllerView() {
  const [searchParams] = useSearchParams();
  const { room, deviceId, isConnected, joinRoom, playerName, playerAvatar } = usePartyStore();

  // Auto-reconnect if deviceId and room in URL
  useEffect(() => {
    const urlCode = searchParams.get('room');
    if (urlCode && playerName && isConnected && (!room || room.code !== urlCode.toUpperCase())) {
      joinRoom(urlCode.toUpperCase(), playerName, playerAvatar || '🦁');
    }
  }, [searchParams, isConnected, playerName, playerAvatar, room, joinRoom]);

  // Find player by deviceId
  const player = room?.players[deviceId];

  // If not joined or player disconnected/not in room state
  if (!room || !player) {
    return <ControllerJoin onJoined={() => {}} />;
  }

  // ─── GAME OVER VIEW ───────────────────────────────────────────────────────
  if (room.phase === 'GAME_OVER') {
    return (
      <div className="h-dvh playful-bg flex flex-col justify-between p-6 select-none text-center">
        <div className="my-auto space-y-5 max-w-sm mx-auto w-full playful-card p-8 shadow-2xl">
          <span className="text-7xl block animate-bounce">🏆</span>
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            نهاية اللعبة! 🎉
          </h2>
          <div className="bg-white/10 border border-white/15 p-4 rounded-3xl shadow-sm">
            <span className="text-xs text-white/70 block mb-2 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              النتيجة النهائية:
            </span>
            <div className="flex justify-around text-lg font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-emerald-300">🦅 {room.teams.A.name}: {room.teams.A.score}</span>
              <span className="text-purple-300">🐺 {room.teams.B.name}: {room.teams.B.score}</span>
            </div>
          </div>
          <p className="text-white/60 text-xs font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            المضيف سيقوم باختيار لعبة ثانية للرجوع للوبي 🎮
          </p>
        </div>

        <div className="text-center pb-2">
          <span className="text-xs text-white/40 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            PartyHub — ألعاب السهرة والمجلس
          </span>
        </div>
      </div>
    );
  }

  // ─── LOBBY & PREVIEW PHASES ───────────────────────────────────────────────
  if (room.phase === 'LOBBY' || room.phase === 'GAME_SELECT' || room.phase === 'RULES_PREVIEW') {
    return <ControllerLobby room={room} player={player} />;
  }

  // ─── ACTIVE GAME CONTROLLER ───────────────────────────────────────────────
  if ((room.phase === 'IN_GAME' || room.phase === 'ROUND_SUMMARY') && room.gameState) {
    switch (room.gameState.gameId) {
      case 'TABOO':
        return <TabooController room={room} state={room.gameState} player={player} />;
      case 'WAVELENGTH':
        return <WavelengthController room={room} state={room.gameState} player={player} />;
      case 'FAMILY_FEUD':
        return <FamilyFeudController room={room} state={room.gameState} player={player} />;
      case 'SPYFALL':
        return <SpyfallController room={room} state={room.gameState} player={player} />;
    }
  }

  return <ControllerLobby room={room} player={player} />;
}
