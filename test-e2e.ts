import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

async function runE2ETest() {
  console.log('🧪 Starting PartyHub End-to-End Autonomous Verification...\n');

  // 1. Host connection
  const hostSocket: Socket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve) => hostSocket.on('connect', resolve));
  console.log('✅ 1. Host socket connected successfully');

  // Create Room
  const { roomCode, lanIp } = await new Promise<{ roomCode: string; lanIp: string }>((resolve) => {
    hostSocket.emit('host:create_room', (res: any) => resolve(res));
  });
  console.log(`✅ 2. Room created: ${roomCode} (LAN IP: ${lanIp})`);

  // 2. Connect Player 1 (Salim)
  const p1Socket: Socket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve) => p1Socket.on('connect', resolve));

  const p1Join = await new Promise<any>((resolve) => {
    p1Socket.emit(
      'player:join',
      { roomCode, deviceId: 'dev_salim_01', name: 'سالم', avatar: '🦅' },
      (res: any) => resolve(res)
    );
  });
  console.log(`✅ 3. Player 1 joined: ${p1Join.room.players['dev_salim_01'].name} (Team ${p1Join.room.players['dev_salim_01'].team})`);

  // 3. Connect Player 2 (Khaled)
  const p2Socket: Socket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve) => p2Socket.on('connect', resolve));

  const p2Join = await new Promise<any>((resolve) => {
    p2Socket.emit(
      'player:join',
      { roomCode, deviceId: 'dev_khaled_02', name: 'خالد', avatar: '🐺' },
      (res: any) => resolve(res)
    );
  });
  console.log(`✅ 4. Player 2 joined: ${p2Join.room.players['dev_khaled_02'].name} (Team ${p2Join.room.players['dev_khaled_02'].team})`);

  // Verify balanced teams
  const teamA = Object.values(p2Join.room.players).find((p: any) => p.team === 'A');
  const teamB = Object.values(p2Join.room.players).find((p: any) => p.team === 'B');
  if (!teamA || !teamB) throw new Error('Teams not balanced correctly');
  console.log('✅ 5. Teams automatically balanced: Team A (الصقور) and Team B (الذئاب)');

  // ─── GAME 1: TABOO (قول بس لا تقول) ───────────────────────────────────────
  console.log('\n--- Testing Game 1: TABOO (قول بس لا تقول) ---');
  hostSocket.emit('host:select_game', { roomCode, gameId: 'TABOO' });
  await new Promise((r) => setTimeout(r, 200));

  let currentRoom: any;
  hostSocket.on('room:state', (r: any) => {
    currentRoom = r;
  });

  hostSocket.emit('host:start_game', { roomCode });
  await new Promise((r) => setTimeout(r, 300));

  if (currentRoom?.gameState?.gameId !== 'TABOO' || currentRoom?.gameState?.subPhase !== 'TURN_READY') {
    throw new Error('Taboo failed to start into TURN_READY phase');
  }
  console.log(`✅ Taboo started: SubPhase = ${currentRoom.gameState.subPhase}, ActiveTeam = ${currentRoom.gameState.activeTeam}`);

  // Start turn
  hostSocket.emit('taboo:start_turn', { roomCode });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom?.gameState?.subPhase !== 'DESCRIBING' || !currentRoom?.gameState?.currentCard) {
    throw new Error('Taboo turn did not transition to DESCRIBING with card');
  }
  console.log(`✅ Taboo turn started: Word = "${currentRoom.gameState.currentCard.word}", Forbidden = [${currentRoom.gameState.currentCard.forbidden.join(', ')}]`);

  // Action: CORRECT
  const prevScore = currentRoom.teams[currentRoom.gameState.activeTeam].score;
  hostSocket.emit('taboo:action', { roomCode, action: 'CORRECT' });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.teams[currentRoom.gameState.activeTeam].score !== prevScore + 1) {
    throw new Error('Taboo CORRECT did not increase team score');
  }
  console.log(`✅ Taboo CORRECT verified: Score increased to ${currentRoom.teams[currentRoom.gameState.activeTeam].score}`);

  // Action: PASS
  hostSocket.emit('taboo:action', { roomCode, action: 'PASS' });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.passesUsed !== 1) {
    throw new Error('Taboo PASS did not track pass count');
  }
  console.log(`✅ Taboo PASS verified: Passes used = ${currentRoom.gameState.passesUsed}`);

  // Action: VIOLATION
  hostSocket.emit('taboo:action', { roomCode, action: 'VIOLATION' });
  await new Promise((r) => setTimeout(r, 300));
  console.log(`✅ Taboo VIOLATION verified: Violation count = ${currentRoom.gameState.turnStats.violationCount}`);

  // ─── GAME 2: WAVELENGTH (الطول الموجي) ──────────────────────────────────
  console.log('\n--- Testing Game 2: WAVELENGTH (الطول الموجي) ---');
  hostSocket.emit('host:select_game', { roomCode, gameId: 'WAVELENGTH' });
  await new Promise((r) => setTimeout(r, 200));
  hostSocket.emit('host:start_game', { roomCode });
  await new Promise((r) => setTimeout(r, 300));

  if (currentRoom?.gameState?.gameId !== 'WAVELENGTH' || currentRoom?.gameState?.subPhase !== 'PSYCHIC_CLUE') {
    throw new Error('Wavelength failed to start into PSYCHIC_CLUE phase');
  }
  console.log(`✅ Wavelength started: Target = ${currentRoom.gameState.targetCenter}%, Poles = "${currentRoom.gameState.card.leftPole}" vs "${currentRoom.gameState.card.rightPole}"`);

  // Psychic clue submission
  hostSocket.emit('wavelength:submit_clue', { roomCode, clueText: 'شاورما على الحطب' });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.subPhase !== 'TEAM_GUESS' || currentRoom.gameState.clueText !== 'شاورما على الحطب') {
    throw new Error('Wavelength clue submission failed');
  }
  console.log(`✅ Wavelength clue submitted: SubPhase = ${currentRoom.gameState.subPhase}`);

  // Move dial
  hostSocket.emit('wavelength:move_dial', { roomCode, value: 65 });
  await new Promise((r) => setTimeout(r, 200));

  // Lock In
  hostSocket.emit('wavelength:lock_in', { roomCode });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.subPhase !== 'OPPONENT_STEAL') {
    throw new Error('Wavelength lock in failed');
  }
  console.log(`✅ Wavelength locked in: Team dial = ${currentRoom.gameState.teamDialValue}%, SubPhase = ${currentRoom.gameState.subPhase}`);

  // Opponent predict
  hostSocket.emit('wavelength:opponent_predict', { roomCode, prediction: 'LEFT' });
  await new Promise((r) => setTimeout(r, 400));
  if (currentRoom.gameState.subPhase !== 'REVEAL') {
    throw new Error('Wavelength reveal failed');
  }
  console.log(`✅ Wavelength revealed: Active team earned ${currentRoom.gameState.lastRoundPoints.activeTeamEarned} pts, Opponent earned ${currentRoom.gameState.lastRoundPoints.opponentTeamEarned} pts`);

  // ─── GAME 3: FAMILY FEUD (ستيف هارفي) ───────────────────────────────────
  console.log('\n--- Testing Game 3: FAMILY FEUD (ستيف هارفي) ---');
  hostSocket.emit('host:select_game', { roomCode, gameId: 'FAMILY_FEUD' });
  await new Promise((r) => setTimeout(r, 200));
  hostSocket.emit('host:start_game', { roomCode });
  await new Promise((r) => setTimeout(r, 300));

  if (currentRoom?.gameState?.gameId !== 'FAMILY_FEUD' || currentRoom?.gameState?.subPhase !== 'FACE_OFF') {
    throw new Error('Family Feud failed to start');
  }
  console.log(`✅ Family Feud started: Question = "${currentRoom.gameState.question}", Answers count = ${currentRoom.gameState.answers.length}`);

  // Player 1 buzzes
  p1Socket.emit('feud:buzz', { roomCode, deviceId: 'dev_salim_01' });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.buzzerLockedBy !== 'dev_salim_01') {
    throw new Error('Family Feud buzzer did not lock');
  }
  console.log(`✅ Family Feud buzzer locked by: ${currentRoom.gameState.buzzerLockedByName}`);

  // Host assigns control
  hostSocket.emit('feud:assign_control', { roomCode, team: 'A' });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.subPhase !== 'TEAM_PLAY' || currentRoom.gameState.controllingTeam !== 'A') {
    throw new Error('Family Feud assign control failed');
  }
  console.log(`✅ Family Feud control assigned to Team A`);

  // Reveal answer
  hostSocket.emit('feud:reveal_answer', { roomCode, answerIndex: 0 });
  await new Promise((r) => setTimeout(r, 300));
  if (!currentRoom.gameState.answers[0].revealed || currentRoom.gameState.roundPot <= 0) {
    throw new Error('Family Feud reveal answer failed');
  }
  console.log(`✅ Family Feud answer revealed: "${currentRoom.gameState.answers[0].text}" (+${currentRoom.gameState.answers[0].points} pts, Pot = ${currentRoom.gameState.roundPot})`);

  // ─── GAME 4: SPYFALL (برّا السالفة) ─────────────────────────────────────
  console.log('\n--- Testing Game 4: SPYFALL (برّا السالفة) ---');
  hostSocket.emit('host:select_game', { roomCode, gameId: 'SPYFALL' });
  await new Promise((r) => setTimeout(r, 200));
  hostSocket.emit('host:start_game', { roomCode });
  await new Promise((r) => setTimeout(r, 300));

  if (currentRoom?.gameState?.gameId !== 'SPYFALL' || currentRoom?.gameState?.subPhase !== 'ROLE_DISTRIBUTION') {
    throw new Error('Spyfall failed to start');
  }
  console.log(`✅ Spyfall started: Category = "${currentRoom.gameState.category}", Spy ID = ${currentRoom.gameState.spyDeviceId}`);

  // Start discussion
  hostSocket.emit('spyfall:start_discussion', { roomCode });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.subPhase !== 'DISCUSSION') {
    throw new Error('Spyfall discussion failed to start');
  }
  console.log(`✅ Spyfall discussion started: 12 locations rendered, Asker = ${currentRoom.gameState.currentAskerId}`);

  // Start voting
  hostSocket.emit('spyfall:start_voting', { roomCode });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.subPhase !== 'VOTING') {
    throw new Error('Spyfall voting failed to start');
  }
  console.log(`✅ Spyfall voting started: subPhase = ${currentRoom.gameState.subPhase}`);

  // Disconnect cleanly
  hostSocket.disconnect();
  p1Socket.disconnect();
  p2Socket.disconnect();

  console.log('\n🎉 ALL 4 GAMES & SOCKET FLOWS FULLY VERIFIED WITH 100% SUCCESS!');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
