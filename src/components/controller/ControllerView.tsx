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
      <div className="h-dvh bg-slate-950 flex flex-col justify-between p-6 select-none text-center">
        <div className="my-auto space-y-4">
          <Trophy className="w-20 h-20 text-amber-400 mx-auto animate-bounce" />
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
            نهاية اللعبة! 🎉
          </h2>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">النتيجة النهائية:</span>
            <div className="flex justify-around text-lg font-black mt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <span className="text-emerald-400">🦅 {room.teams.A.name}: {room.teams.A.score}</span>
              <span className="text-violet-400">🐺 {room.teams.B.name}: {room.teams.B.score}</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>
            المضيف سيقوم بالعودة للوبي أو اختيار لعبة جديدة
          </p>
        </div>

        <div className="text-center pb-2">
          <span className="text-xs text-slate-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
            PartyHub — العاب السهرة
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
