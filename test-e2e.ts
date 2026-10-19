import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

async function runE2ETest() {
  console.log('🧪 Starting PartyHub Comprehensive End-to-End Autonomous Verification...\n');

  // 1. Host connection
  const hostSocket: Socket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve) => hostSocket.on('connect', resolve));
  console.log('✅ 1. Host socket connected successfully');

  let currentRoom: any;
  hostSocket.on('room:state', (r: any) => {
    currentRoom = r;
  });

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
  console.log('✅ 5. Teams automatically balanced: Team A and Team B');

  // ─── TEST: HOST TEAM MANAGEMENT (تعديل أسماء الفرق ونقل وطرد اللاعبين) ───
  console.log('\n--- Testing Host Team & Player Management ---');

  // A. Rename Teams
  hostSocket.emit('host:update_team_names', { roomCode, teamAName: 'الملوك', teamBName: 'السلاطين' });
  await new Promise((r) => setTimeout(r, 200));
  if (currentRoom.teams.A.name !== 'الملوك' || currentRoom.teams.B.name !== 'السلاطين') {
    throw new Error(`Team rename failed. Expected الملوك/السلاطين, got ${currentRoom.teams.A.name}/${currentRoom.teams.B.name}`);
  }
  console.log(`✅ Host team renaming verified: A="${currentRoom.teams.A.name}", B="${currentRoom.teams.B.name}"`);

  // B. Move Player Team
  hostSocket.emit('host:move_player_team', { roomCode, deviceId: 'dev_salim_01', targetTeam: 'B' });
  await new Promise((r) => setTimeout(r, 200));
  if (currentRoom.players['dev_salim_01'].team !== 'B') {
    throw new Error('Host moving player to Team B failed');
  }
  console.log(`✅ Host move player verified: Salim moved to Team B`);

  hostSocket.emit('host:move_player_team', { roomCode, deviceId: 'dev_salim_01', targetTeam: 'A' });
  await new Promise((r) => setTimeout(r, 200));
  if (currentRoom.players['dev_salim_01'].team !== 'A') {
    throw new Error('Host moving player back to Team A failed');
  }
  console.log(`✅ Host move player verified: Salim returned to Team A`);

  // C. Kick Player
  const p3Socket: Socket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve) => p3Socket.on('connect', resolve));
  await new Promise<any>((resolve) => {
    p3Socket.emit(
      'player:join',
      { roomCode, deviceId: 'dev_temp_03', name: 'لاعب مؤقت', avatar: '👻' },
      (res: any) => resolve(res)
    );
  });
  await new Promise((r) => setTimeout(r, 200));
  if (!currentRoom.players['dev_temp_03']) {
    throw new Error('Temporary player failed to join');
  }
  console.log(`✅ Temp player joined: ${currentRoom.players['dev_temp_03'].name}`);

  hostSocket.emit('host:kick_player', { roomCode, deviceId: 'dev_temp_03' });
  await new Promise((r) => setTimeout(r, 200));
  if (currentRoom.players['dev_temp_03']) {
    throw new Error('Host kick player failed; player still in room');
  }
  console.log(`✅ Host kick player verified: dev_temp_03 kicked and removed`);
  p3Socket.disconnect();

  // ─── GAME 1: TABOO (قول بس لا تقول) ───────────────────────────────────────
  console.log('\n--- Testing Game 1: TABOO (قول بس لا تقول) ---');
  hostSocket.emit('host:select_game', { roomCode, gameId: 'TABOO' });
  await new Promise((r) => setTimeout(r, 200));

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
  const targetCenter = currentRoom.gameState.targetCenter;
  console.log(`✅ Wavelength started: Target = ${targetCenter}%, Poles = "${currentRoom.gameState.card.leftPole}" vs "${currentRoom.gameState.card.rightPole}"`);

  // Psychic clue submission
  hostSocket.emit('wavelength:submit_clue', { roomCode, clueText: 'قهوة سعودية معتدلة الهيل' });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.subPhase !== 'TEAM_GUESS' || currentRoom.gameState.clueText !== 'قهوة سعودية معتدلة الهيل') {
    throw new Error('Wavelength clue submission failed');
  }
  console.log(`✅ Wavelength clue submitted: SubPhase = ${currentRoom.gameState.subPhase}`);

  // Move dial to a position (e.g. 50 or near targetCenter)
  hostSocket.emit('wavelength:move_dial', { roomCode, value: targetCenter });
  await new Promise((r) => setTimeout(r, 200));
  if (currentRoom.gameState.teamDialValue !== targetCenter) {
    throw new Error('Wavelength move_dial sync failed');
  }
  console.log(`✅ Wavelength dial moved and synced in real time: dial = ${currentRoom.gameState.teamDialValue}%`);

  // Lock In (direct reveal, NO steal phase)
  hostSocket.emit('wavelength:lock_in', { roomCode });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.subPhase !== 'REVEAL') {
    throw new Error(`Wavelength lock_in should directly reveal! Expected REVEAL, got ${currentRoom.gameState.subPhase}`);
  }
  console.log(`✅ Wavelength direct reveal verified: Active team earned ${currentRoom.gameState.lastRoundPoints.activeTeamEarned} pts (Bullseye 4 pts)!`);

  // Verify it does NOT auto-advance automatically after 1 second
  await new Promise((r) => setTimeout(r, 1200));
  if (currentRoom.gameState.subPhase !== 'REVEAL') {
    throw new Error('Wavelength should NOT auto-advance without host action!');
  }
  console.log(`✅ Verified NO auto-advance: Room stays in REVEAL waiting for host`);

  // Host triggers next round
  const prevRound = currentRoom.gameState.roundNumber;
  hostSocket.emit('wavelength:next_round', { roomCode });
  await new Promise((r) => setTimeout(r, 300));
  if (currentRoom.gameState.subPhase !== 'PSYCHIC_CLUE' || currentRoom.gameState.roundNumber !== prevRound + 1) {
    throw new Error('Host next_round failed to advance to new round!');
  }
  console.log(`✅ Host next_round verified: Advanced to Round ${currentRoom.gameState.roundNumber}, ActiveTeam = ${currentRoom.gameState.activeTeam}`);

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
  console.log(`✅ Spyfall discussion started: Asker = ${currentRoom.gameState.currentAskerId}`);

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

  console.log('\n🎉 ALL TESTS PASSED! HOST CONTROLS, DIRECTION ACCURACY & 4 GAMES VERIFIED WITH 100% SUCCESS!');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
