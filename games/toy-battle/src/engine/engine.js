import { PLAYERS, TROOP_CATALOG, TROOP_TYPES, createTroopInstancesForPlayer, getTroopDefinition } from "./catalog.js";
import { createRandom, nextRandomIndex, shuffleWithSeed } from "./random.js";
import { syntheticMvpTerrain } from "./fixtures.js";

const SUPPORT_LIMIT = 8;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function opponentOf(player) {
  return player === "blue" ? "red" : "blue";
}

function eventId(state) {
  return `event-${state.eventLog.length + 1}`;
}

function getNode(terrain, nodeId) {
  return terrain.nodes.find((node) => node.id === nodeId) ?? null;
}

function baseNodes(terrain) {
  return terrain.nodes.filter((node) => node.kind === "base" || node.kind === "specialBase");
}

function hqNodes(terrain) {
  return terrain.nodes.filter((node) => node.kind === "hq");
}

function specialBaseNodes(terrain) {
  return terrain.nodes.filter((node) => node.kind === "specialBase");
}

function adjacentNodeIds(terrain, nodeId) {
  const ids = [];
  for (const edge of terrain.edges) {
    if (edge.a === nodeId) ids.push(edge.b);
    if (edge.b === nodeId) ids.push(edge.a);
  }
  return ids;
}

function topTroopId(state, baseId) {
  const stack = state.board.stacks[baseId];
  if (!stack || stack.troopIds.length === 0) return null;
  return stack.troopIds[stack.troopIds.length - 1];
}

function occupyingPlayer(state, baseId) {
  const troopId = topTroopId(state, baseId);
  return troopId ? state.troops[troopId].owner : null;
}

function updateTroopLocationsForZone(state, player, zoneName) {
  const entries = state.players[player][zoneName];
  entries.forEach((entry, index) => {
    const troopId = zoneName === "support" ? entry.troopId : entry;
    state.troops[troopId].location = {
      zone: zoneName === "removedFromGame" ? "removedFromGame" : zoneName,
      owner: player,
      index,
      visibility: zoneName === "discard" ? "public" : zoneName === "support" ? "ownerOnly" : "hidden",
    };
  });
}

function updateStackLocations(state, baseId) {
  state.board.stacks[baseId].troopIds.forEach((troopId, depth) => {
    state.troops[troopId].location = { zone: "stack", nodeId: baseId, depth, visibility: "public" };
  });
}

function updateDiscardLocations(state, player) {
  updateTroopLocationsForZone(state, player, "discard");
}

function updateSupportLocations(state, player) {
  updateTroopLocationsForZone(state, player, "support");
}

function removeFromSupport(state, player, troopId) {
  const support = state.players[player].support;
  const index = support.findIndex((slot) => slot.troopId === troopId);
  if (index < 0) return false;
  support.splice(index, 1);
  state.players[player].support.forEach((slot, slotIndex) => {
    state.troops[slot.troopId].location = {
      zone: "support",
      owner: player,
      index: slotIndex,
      visibility: "ownerOnly",
    };
  });
  return true;
}

function appendEvent(state, event) {
  state.eventLog.push({ id: eventId(state), turn: state.turn.turnNumber, ...event });
}

function specialBaseEffectOf(node) {
  const effect = node?.specialBaseEffect;
  if (!effect) return null;
  if (typeof effect === "string") return { kind: effect };
  return effect;
}

function hasTerrainRestriction(node, troopDefinition) {
  if (!node.placementRestriction) return true;
  if (node.placementRestriction.kind !== "allowedTroopForces") return true;
  return typeof troopDefinition.force === "number" && node.placementRestriction.allowedForces.includes(troopDefinition.force);
}

function isConnectedToOwnHq(state, player, targetNodeId) {
  const hqIds = hqNodes(state.terrain)
    .filter((node) => node.owner === player)
    .map((node) => node.id);
  const visited = new Set(hqIds);
  const queue = [...hqIds];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const next of adjacentNodeIds(state.terrain, current)) {
      if (next === targetNodeId) return true;
      if (visited.has(next)) continue;
      const node = getNode(state.terrain, next);
      if (!node || node.kind === "hq") continue;
      if (occupyingPlayer(state, node.id) === player) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

function canCoverEnemy(troopDefinition, enemyDefinition) {
  if (troopDefinition.type === "kwak") return true;
  if (enemyDefinition.type === "kwak") return true;
  return typeof troopDefinition.force === "number"
    && typeof enemyDefinition.force === "number"
    && troopDefinition.force > enemyDefinition.force;
}

function placementLegality(state, player, troopId, targetNodeId) {
  if (state.winner) return { ok: false, code: "gameOver", message: "Game is already over." };
  if (state.turn.currentPlayer !== player) return { ok: false, code: "notCurrentPlayer", message: "It is not this player's turn." };
  const supportSlot = state.players[player].support.find((slot) => slot.troopId === troopId);
  if (!supportSlot) return { ok: false, code: "troopNotInSupport", message: "Troop is not in current player's support." };
  if (supportSlot.availability !== "available") {
    return { ok: false, code: "troopTemporarilyUnavailable", message: "Troop is temporarily unavailable." };
  }

  const targetNode = getNode(state.terrain, targetNodeId);
  if (!targetNode) return { ok: false, code: "unknownTarget", message: "Target node does not exist." };

  const troop = state.troops[troopId];
  const troopDefinition = getTroopDefinition(troop.type);

  if (targetNode.kind === "hq") {
    if (targetNode.owner === player) return { ok: false, code: "ownHqForbidden", message: "Cannot place on own HQ." };
    if (!isConnectedToOwnHq(state, player, targetNodeId)) {
      return { ok: false, code: "targetNotConnected", message: "Enemy HQ is not connected." };
    }
    return { ok: true, targetKind: "enemyHq", connection: "requiredAndSatisfied" };
  }

  if (!hasTerrainRestriction(targetNode, troopDefinition)) {
    return { ok: false, code: "terrainRestrictionDenied", message: "Terrain placement restriction denies this troop." };
  }

  const ignoresConnection = troop.type === "crochet";
  if (!ignoresConnection && !isConnectedToOwnHq(state, player, targetNodeId)) {
    return { ok: false, code: "targetNotConnected", message: "Target base is not connected." };
  }

  const connection = ignoresConnection ? "ignoredByCrochetForBase" : "requiredAndSatisfied";
  const topId = topTroopId(state, targetNodeId);
  if (!topId) return { ok: true, targetKind: "emptyBase", connection };

  const topTroop = state.troops[topId];
  if (topTroop.owner === player) return { ok: true, targetKind: "ownOccupiedBase", connection };

  const enemyDefinition = getTroopDefinition(topTroop.type);
  if (!canCoverEnemy(troopDefinition, enemyDefinition)) {
    return { ok: false, code: "enemyForceTooHigh", message: "Enemy troop force is not lower." };
  }
  return {
    ok: true,
    targetKind: troop.type === "kwak" || topTroop.type === "kwak" ? "kwakJokerCover" : "enemyWeakerBase",
    connection,
  };
}

export function explainPlacement(state, player, troopId, targetNodeId) {
  return placementLegality({ ...state, turn: { ...state.turn, currentPlayer: player } }, player, troopId, targetNodeId);
}

function claimRegions(state) {
  for (const region of state.terrain.regions) {
    let controller = null;
    for (const player of PLAYERS) {
      if (region.boundaryBaseIds.every((baseId) => occupyingPlayer(state, baseId) === player)) {
        controller = player;
        break;
      }
    }
    state.board.controlledRegions[region.id] = controller;
    if (!controller) continue;

    const claimable = region.medalSpaceIds.filter((medalId) => state.board.unclaimedMedals[medalId]?.status === "unclaimed");
    if (claimable.length === 0) continue;
    for (const medalId of claimable) {
      state.board.unclaimedMedals[medalId].status = "claimed";
      state.board.unclaimedMedals[medalId].claimedBy = controller;
      state.players[controller].medals.push(medalId);
    }
    appendEvent(state, { kind: "regionControlled", regionId: region.id, player: controller, claimedMedalIds: claimable });
  }
}

function checkMedalVictory(state, player) {
  if (state.players[player].medals.length >= state.players[player].objectiveMedals) {
    state.winner = { winner: player, reason: "reachedMedalObjective", atTurn: state.turn.turnNumber };
    state.turn.phase = "gameOver";
    appendEvent(state, { kind: "win", winner: player, reason: "reachedMedalObjective" });
  }
}

function checkAllMedalVictories(state) {
  for (const player of PLAYERS) {
    if (!state.winner) checkMedalVictory(state, player);
  }
}

function countLegalActionsFor(state, player) {
  if (state.winner) return 0;
  let count = 0;
  if (state.players[player].support.length < SUPPORT_LIMIT && state.players[player].reserve.length > 0) count += 1;
  for (const slot of state.players[player].support) {
    if (slot.availability !== "available") continue;
    for (const node of state.terrain.nodes) {
      if (placementLegality({ ...state, turn: { ...state.turn, currentPlayer: player } }, player, slot.troopId, node.id).ok) count += 1;
    }
  }
  return count;
}

function applyNoActionFallbackIfNeeded(state) {
  const player = state.turn.currentPlayer;
  if (countLegalActionsFor(state, player) > 0) return;
  const opponent = opponentOf(player);
  const playerMedals = state.players[player].medals.length;
  const opponentMedals = state.players[opponent].medals.length;
  const winner = opponentMedals > playerMedals ? opponent : playerMedals > opponentMedals ? player : opponent;
  const reason = playerMedals === opponentMedals ? "opponentCannotActTieBreaker" : "opponentCannotActMoreMedals";
  state.winner = { winner, reason, atTurn: state.turn.turnNumber };
  state.turn.phase = "gameOver";
  appendEvent(state, { kind: "win", winner, reason });
}

function finishTurn(state) {
  if (state.winner) return state;
  restoreSupportAvailability(state, state.turn.currentPlayer);
  state.turn.currentPlayer = opponentOf(state.turn.currentPlayer);
  state.turn.turnNumber += 1;
  state.turn.actionTakenThisTurn = false;
  applyNoActionFallbackIfNeeded(state);
  return state;
}

function restoreSupportAvailability(state, player) {
  for (const slot of state.players[player].support) {
    if (slot.availability !== "available" && slot.unavailableReason?.source === "battlefieldSpecialBase") {
      slot.availability = "available";
      delete slot.unavailableReason;
      appendEvent(state, { kind: "troopAvailable", troopId: slot.troopId, owner: player });
    }
  }
}

function drawFromReserveForEffect(state, player, count, sourceTroopId) {
  const capacity = SUPPORT_LIMIT - state.players[player].support.length;
  const drawCount = Math.min(count, capacity, state.players[player].reserve.length);
  if (drawCount <= 0) {
    appendEvent(state, {
      kind: "effectSkipped",
      source: { troopId: sourceTroopId },
      reason: capacity <= 0 ? "supportFull" : "reserveEmpty",
    });
    return [];
  }

  const drawn = state.players[player].reserve.splice(0, drawCount);
  state.players[player].support.push(...drawn.map((troopId) => ({ troopId, availability: "available", hiddenFromOpponent: true })));
  updateTroopLocationsForZone(state, player, "reserve");
  updateTroopLocationsForZone(state, player, "support");
  appendEvent(state, { kind: "draw", player, count: drawCount, troopIds: drawn, source: "effect", sourceTroopId });
  return drawn;
}

function visibleBaseOfTroop(state, troopId) {
  const location = state.troops[troopId]?.location;
  if (!location || location.zone !== "stack") return null;
  return topTroopId(state, location.nodeId) === troopId ? location.nodeId : null;
}

function discardVisibleTroop(state, troopId, reason) {
  const baseId = visibleBaseOfTroop(state, troopId);
  if (!baseId) return false;

  const troop = state.troops[troopId];
  const from = clone(troop.location);
  const stack = state.board.stacks[baseId].troopIds;
  stack.pop();
  updateStackLocations(state, baseId);
  state.players[troop.owner].discard.push(troopId);
  updateDiscardLocations(state, troop.owner);
  appendEvent(state, { kind: "discardTroop", troopId, from, reason });
  return true;
}

function discardSupportTroop(state, player, troopId, reason) {
  const index = state.players[player].support.findIndex((slot) => slot.troopId === troopId);
  if (index < 0) return false;

  const from = clone(state.troops[troopId].location);
  state.players[player].support.splice(index, 1);
  state.players[player].discard.push(troopId);
  updateTroopLocationsForZone(state, player, "support");
  updateDiscardLocations(state, player);
  appendEvent(state, { kind: "discardTroop", troopId, from, reason });
  return true;
}

function returnVisibleTroopToSupport(state, player, troopId, reason) {
  if (state.players[player].support.length >= SUPPORT_LIMIT) return false;
  const baseId = visibleBaseOfTroop(state, troopId);
  if (!baseId || state.troops[troopId].owner !== player) return false;

  const from = clone(state.troops[troopId].location);
  state.board.stacks[baseId].troopIds.pop();
  updateStackLocations(state, baseId);
  state.players[player].support.push({ troopId, availability: "available", hiddenFromOpponent: true });
  updateSupportLocations(state, player);
  appendEvent(state, { kind: "returnTroopToSupport", troopId, fromBaseId: baseId, from, reason });
  return true;
}

function recoverDiscardToSupport(state, player, troopId, reason) {
  if (state.players[player].support.length >= SUPPORT_LIMIT) return false;
  const index = state.players[player].discard.indexOf(troopId);
  if (index < 0) return false;
  state.players[player].discard.splice(index, 1);
  state.players[player].support.push({ troopId, availability: "available", hiddenFromOpponent: true });
  updateDiscardLocations(state, player);
  updateSupportLocations(state, player);
  appendEvent(state, { kind: "returnTroopToSupport", troopId, reason });
  return true;
}

function moveVisibleTroopToBase(state, troopId, toBaseId, reason) {
  const fromBaseId = visibleBaseOfTroop(state, troopId);
  const targetNode = getNode(state.terrain, toBaseId);
  if (!fromBaseId || !targetNode || targetNode.kind === "hq") return false;
  if (!adjacentNodeIds(state.terrain, fromBaseId).includes(toBaseId)) return false;

  state.board.stacks[fromBaseId].troopIds.pop();
  updateStackLocations(state, fromBaseId);
  state.board.stacks[toBaseId].troopIds.push(troopId);
  updateStackLocations(state, toBaseId);
  appendEvent(state, { kind: "moveTroop", troopId, fromBaseId, toBaseId, reason });
  return true;
}

function isValidMastokTarget(state, player, sourceTroopId, targetTroopId) {
  const sourceBaseId = visibleBaseOfTroop(state, sourceTroopId);
  const targetBaseId = visibleBaseOfTroop(state, targetTroopId);
  if (!sourceBaseId || !targetBaseId) return false;
  if (state.troops[targetTroopId]?.owner !== opponentOf(player)) return false;
  return adjacentNodeIds(state.terrain, sourceBaseId).includes(targetBaseId);
}

function skipEffect(state, troopId, reason = "choiceSkipped") {
  appendEvent(state, { kind: "effectSkipped", source: { troopId }, reason });
}

function skipBaseEffect(state, baseId, reason = "choiceSkipped") {
  appendEvent(state, { kind: "effectSkipped", source: { baseId }, reason });
}

function normalizeEffectChoice(effectChoice) {
  return effectChoice ?? { kind: "skip" };
}

function resolveTroopEffect(state, player, troopId, effectChoice, chainDepth, context) {
  if (state.winner) return { ok: true };
  const troop = state.troops[troopId];
  const choice = normalizeEffectChoice(effectChoice);

  if (choice.kind === "skip") {
    if (getTroopDefinition(troop.type).effect.kind !== "none" && troop.type !== "crochet") skipEffect(state, troopId);
    return { ok: true };
  }

  if (troop.type === "skully") {
    drawFromReserveForEffect(state, player, 2, troopId);
    return { ok: true };
  }

  if (troop.type === "star") {
    drawFromReserveForEffect(state, player, 1, troopId);
    return { ok: true };
  }

  if (troop.type === "mastok") {
    if (choice.kind !== "selectTroop" || !choice.troopId || !isValidMastokTarget(state, player, troopId, choice.troopId)) {
      skipEffect(state, troopId, "noValidTarget");
      return { ok: true };
    }
    discardVisibleTroop(state, choice.troopId, "mastokEffect");
    claimRegions(state);
    checkAllMedalVictories(state);
    return { ok: true };
  }

  if (troop.type === "xb42") {
    const opponent = opponentOf(player);
    if (state.players[opponent].support.length === 0) {
      skipEffect(state, troopId, "opponentSupportEmpty");
      return { ok: true };
    }
    const index = nextRandomIndex(state.random, state.players[opponent].support.length, `xb42:${troopId}`);
    const targetTroopId = state.players[opponent].support[index].troopId;
    discardSupportTroop(state, opponent, targetTroopId, "xb42Effect");
    return { ok: true };
  }

  if (troop.type === "captaine") {
    const additional = choice.kind === "placeAdditionalTroop" || choice.kind === "selectAdditionalPlacement" ? choice : null;
    if (!additional?.troopId || !additional?.targetNodeId) {
      skipEffect(state, troopId, "noAdditionalPlacement");
      return { ok: true };
    }
    if (chainDepth >= 24) {
      return { ok: false, code: "effectChainLimit", message: "Cap'taine effect chain exceeded the troop limit." };
    }
    const result = placeTroopInTurn(state, player, additional.troopId, additional.targetNodeId, additional.effect, chainDepth + 1, context);
    if (!result.ok) {
      skipEffect(state, troopId, result.error?.code ?? "additionalPlacementIllegal");
      return { ok: true };
    }
    return { ok: true };
  }

  return { ok: true };
}

function suppressesTroopEffect(targetNode) {
  return specialBaseEffectOf(targetNode)?.kind === "suppressPlacedTroopEffect";
}

function resolveSpecialBaseEffect(state, player, queuedEffect) {
  if (state.winner || state.options?.specialBaseMode === "ignoreSpecialBaseEffects") return { ok: true };
  const { baseId, effect, placedTroopId, choice } = queuedEffect;
  if (!effect || effect.kind === "none") return { ok: true };

  if (effect.kind === "suppressPlacedTroopEffect") {
    appendEvent(state, { kind: "specialBaseEffect", baseId, effect: effect.kind, placedTroopId, result: "suppressedTroopEffect" });
    return { ok: true };
  }

  if (!choice || choice.kind === "skip") {
    skipBaseEffect(state, baseId);
    return { ok: true };
  }

  if (effect.kind === "returnAnotherVisibleOwnTroopToSupport") {
    if (choice.troopId === placedTroopId || !returnVisibleTroopToSupport(state, player, choice.troopId, "specialBase:returnAnotherVisibleOwnTroopToSupport")) {
      skipBaseEffect(state, baseId, "noValidTarget");
    }
    return { ok: true };
  }

  if (effect.kind === "drawOneFromReserve") {
    drawFromReserveForEffect(state, player, 1, placedTroopId);
    appendEvent(state, { kind: "specialBaseEffect", baseId, effect: effect.kind, placedTroopId });
    return { ok: true };
  }

  if (effect.kind === "moveAdjacentVisibleEnemyTroop") {
    if (!choice.troopId || !choice.targetNodeId) {
      skipBaseEffect(state, baseId, "noValidTarget");
      return { ok: true };
    }
    const sourceBaseId = visibleBaseOfTroop(state, choice.troopId);
    const sourceIsAdjacentToSpecialBase = sourceBaseId && adjacentNodeIds(state.terrain, baseId).includes(sourceBaseId);
    const isEnemy = state.troops[choice.troopId]?.owner === opponentOf(player);
    if (!sourceIsAdjacentToSpecialBase || !isEnemy || !moveVisibleTroopToBase(state, choice.troopId, choice.targetNodeId, "specialBase:moveAdjacentVisibleEnemyTroop")) {
      skipBaseEffect(state, baseId, "noValidTarget");
    }
    return { ok: true };
  }

  if (effect.kind === "recoverOwnDiscardToSupport") {
    if (!choice.troopId || !recoverDiscardToSupport(state, player, choice.troopId, "specialBase:recoverOwnDiscardToSupport")) {
      skipBaseEffect(state, baseId, "noValidTarget");
    }
    return { ok: true };
  }

  if (effect.kind === "markOpponentSupportTroopUnavailableNextTurn") {
    const opponent = opponentOf(player);
    const slot = choice.troopId
      ? state.players[opponent].support.find((item) => item.troopId === choice.troopId)
      : null;
    if (!slot) {
      skipBaseEffect(state, baseId, "noValidTarget");
      return { ok: true };
    }
    slot.availability = "unavailableUntilEndOfOwnerTurn";
    slot.unavailableReason = { source: "battlefieldSpecialBase", appliedOnTurn: state.turn.turnNumber };
    appendEvent(state, { kind: "troopTemporarilyUnavailable", troopId: slot.troopId, owner: opponent, until: "endOfOwnerNextTurn", sourceBaseId: baseId });
    return { ok: true };
  }

  return { ok: true };
}

function resolveQueuedSpecialBaseEffects(state, player, queuedBaseEffects) {
  for (const queuedEffect of queuedBaseEffects) {
    const result = resolveSpecialBaseEffect(state, player, queuedEffect);
    if (!result.ok || state.winner) return result;
    claimRegions(state);
    checkAllMedalVictories(state);
  }
  return { ok: true };
}

function placeTroopInTurn(state, player, troopId, targetNodeId, effectChoice, chainDepth = 0, context = { queuedBaseEffects: [] }) {
  const legality = placementLegality(state, player, troopId, targetNodeId);
  if (!legality.ok) return fail(state, legality.code, legality.message);

  const targetNode = getNode(state.terrain, targetNodeId);
  const placementChoice = effectChoice ?? { kind: "skip" };
  removeFromSupport(state, player, troopId);
  const coveredTroopId = targetNode.kind === "hq" ? null : topTroopId(state, targetNodeId);

  if (targetNode.kind === "hq") {
    state.troops[troopId].location = { zone: "capturedHq", nodeId: targetNodeId, visibility: "public" };
    appendEvent(state, { kind: "placeTroop", player, troopId, targetNodeId });
    state.winner = { winner: player, reason: "capturedEnemyHq", atTurn: state.turn.turnNumber };
    state.turn.phase = "gameOver";
    appendEvent(state, { kind: "win", winner: player, reason: "capturedEnemyHq" });
    return { ok: true, state, events: [] };
  }

  state.board.stacks[targetNodeId].troopIds.push(troopId);
  updateStackLocations(state, targetNodeId);
  appendEvent(state, { kind: "placeTroop", player, troopId, targetNodeId });
  if (coveredTroopId) appendEvent(state, { kind: "coverTroop", coveringTroopId: troopId, coveredTroopId, baseId: targetNodeId });

  if (targetNode.kind === "specialBase" && specialBaseEffectOf(targetNode)) {
    context.queuedBaseEffects.push({
      baseId: targetNodeId,
      effect: specialBaseEffectOf(targetNode),
      placedTroopId: troopId,
      choice: placementChoice.baseEffect ?? { kind: "skip" },
    });
  }

  if (suppressesTroopEffect(targetNode)) {
    appendEvent(state, { kind: "effectSkipped", source: { troopId, baseId: targetNodeId }, reason: "suppressedBySpecialBase" });
  } else {
    const effectResult = resolveTroopEffect(state, player, troopId, placementChoice, chainDepth, context);
    if (!effectResult.ok) return fail(state, effectResult.code, effectResult.message);
  }

  claimRegions(state);
  checkMedalVictory(state, player);
  return { ok: true, state, events: [] };
}

export function setupGame({ terrain = syntheticMvpTerrain, seed = "toy-battle", firstPlayer = "blue", options = { specialBaseMode: "full" } } = {}) {
  const terrainResult = validateTerrain(terrain);
  if (!terrainResult.ok) {
    throw new Error(`Invalid terrain: ${terrainResult.issues.map((issue) => issue.code).join(", ")}`);
  }

  const troops = {};
  const players = {
    blue: { id: "blue", reserve: [], support: [], discard: [], removedFromGame: [], medals: [], objectiveMedals: terrain.objectives.blue.requiredCount },
    red: { id: "red", reserve: [], support: [], discard: [], removedFromGame: [], medals: [], objectiveMedals: terrain.objectives.red.requiredCount },
  };
  const removedTroops = { blue: [], red: [] };
  const openingHands = { blue: [], red: [] };

  let randomState = createRandom(seed);
  for (const player of PLAYERS) {
    for (const troop of createTroopInstancesForPlayer(player)) troops[troop.id] = troop;
    const allIds = Object.values(troops).filter((troop) => troop.owner === player).map((troop) => troop.id);
    const shuffled = shuffleWithSeed(allIds, `${seed}:${player}`);
    randomState.drawsUsed += shuffled.random.drawsUsed;
    players[player].removedFromGame = shuffled.items.slice(0, 4);
    players[player].reserve = shuffled.items.slice(4);
    removedTroops[player] = [...players[player].removedFromGame];
    updateTroopLocationsForZone({ players, troops }, player, "removedFromGame");
    updateTroopLocationsForZone({ players, troops }, player, "reserve");
  }

  const state = {
    schemaVersion: 1,
    gameId: `game-${seed}`,
    terrain: clone(terrain),
    options,
    players,
    troops,
    board: {
      terrainId: terrain.id,
      stacks: Object.fromEntries(baseNodes(terrain).map((node) => [node.id, { baseId: node.id, troopIds: [] }])),
      unclaimedMedals: Object.fromEntries(terrain.medalSpaces.map((medal) => [medal.id, { id: medal.id, regionId: medal.regionId, status: "unclaimed" }])),
      controlledRegions: Object.fromEntries(terrain.regions.map((region) => [region.id, null])),
    },
    turn: { turnNumber: 1, currentPlayer: firstPlayer, phase: "awaitingAction", actionTakenThisTurn: false },
    pending: [],
    random: { seed: String(seed), drawsUsed: randomState.drawsUsed, algorithm: "deterministic-seeded" },
    eventLog: [],
  };

  for (const player of PLAYERS) {
    const openingCount = player === firstPlayer ? 3 : 4;
    const drawn = state.players[player].reserve.splice(0, openingCount);
    openingHands[player] = [...drawn];
    state.players[player].support = drawn.map((troopId) => ({ troopId, availability: "available", hiddenFromOpponent: true }));
    updateTroopLocationsForZone(state, player, "reserve");
    updateTroopLocationsForZone(state, player, "support");
  }

  appendEvent(state, { kind: "gameSetup", firstPlayer, terrainId: terrain.id });
  return { state, removedTroops, openingHands };
}

export function drawTroops(inputState, player = inputState.turn.currentPlayer) {
  const state = clone(inputState);
  if (state.winner) return fail(state, "gameOver", "Game is already over.");
  if (state.turn.currentPlayer !== player) return fail(state, "notCurrentPlayer", "It is not this player's turn.");
  if (state.players[player].support.length >= SUPPORT_LIMIT) return fail(state, "supportFull", "Support is full.");
  if (state.players[player].reserve.length === 0) return fail(state, "reserveEmpty", "Reserve is empty.");

  const capacity = SUPPORT_LIMIT - state.players[player].support.length;
  const count = Math.min(2, capacity, state.players[player].reserve.length);
  const drawn = state.players[player].reserve.splice(0, count);
  state.players[player].support.push(...drawn.map((troopId) => ({ troopId, availability: "available", hiddenFromOpponent: true })));
  updateTroopLocationsForZone(state, player, "reserve");
  updateTroopLocationsForZone(state, player, "support");
  appendEvent(state, { kind: "draw", player, count, troopIds: drawn, source: "action" });
  finishTurn(state);
  return { ok: true, state, events: state.eventLog.slice(-1) };
}

export function placeTroop(inputState, player, troopId, targetNodeId, effectChoice = { kind: "skip" }) {
  const state = clone(inputState);
  const startEventIndex = state.eventLog.length;
  const context = { queuedBaseEffects: [] };
  const result = placeTroopInTurn(state, player, troopId, targetNodeId, effectChoice, 0, context);
  if (!result.ok) return result;
  const baseResult = resolveQueuedSpecialBaseEffects(state, player, context.queuedBaseEffects);
  if (!baseResult.ok) return fail(state, baseResult.code, baseResult.message);
  finishTurn(state);
  return { ok: true, state, events: state.eventLog.slice(startEventIndex) };
}

function fail(state, code, message) {
  return { ok: false, state, events: [], error: { code, message } };
}

export function listLegalActions(state, player = state.turn.currentPlayer) {
  if (state.winner) return [];
  const actions = [];
  if (state.players[player].support.length < SUPPORT_LIMIT && state.players[player].reserve.length > 0) {
    actions.push({ kind: "draw", player, drawCount: Math.min(2, SUPPORT_LIMIT - state.players[player].support.length, state.players[player].reserve.length) });
  }
  for (const slot of state.players[player].support) {
    if (slot.availability !== "available") continue;
    for (const node of state.terrain.nodes) {
      const legality = explainPlacement(state, player, slot.troopId, node.id);
      if (legality.ok) actions.push({ kind: "placeTroop", player, troopId: slot.troopId, targetNodeId: node.id, legality });
    }
  }
  return actions;
}

export function validateTerrain(terrain) {
  const issues = [];
  const nodeIds = new Set();
  const nodes = terrain.nodes ?? [];
  const edges = terrain.edges ?? [];
  const regions = terrain.regions ?? [];
  const medalSpaces = terrain.medalSpaces ?? [];

  if (terrain.official && !["placeholder", "partial", "transcribed", "reviewed"].includes(terrain.transcriptionStatus)) {
    issues.push({ severity: "error", code: "invalidTranscriptionStatus", message: "Official terrain has an invalid transcription status." });
  }

  if (terrain.official && ["transcribed", "reviewed"].includes(terrain.transcriptionStatus)) {
    if (nodes.length === 0) issues.push({ severity: "error", code: "officialTerrainMissingNodes", message: "Official transcribed/reviewed terrain must include nodes." });
    if (edges.length === 0) issues.push({ severity: "error", code: "officialTerrainMissingEdges", message: "Official transcribed/reviewed terrain must include edges." });
    if (regions.length === 0) issues.push({ severity: "error", code: "officialTerrainMissingRegions", message: "Official transcribed/reviewed terrain must include regions." });
    if (medalSpaces.length === 0) issues.push({ severity: "error", code: "officialTerrainMissingMedalSpaces", message: "Official transcribed/reviewed terrain must include medal spaces." });
    if ((terrain.unresolvedDataNotes ?? []).length > 0) {
      issues.push({ severity: "error", code: "officialTerrainHasUnresolvedNotes", message: "Official transcribed/reviewed terrain still has unresolved notes." });
    }
  }

  for (const node of terrain.nodes ?? []) {
    if (nodeIds.has(node.id)) issues.push({ severity: "error", code: "duplicateNode", message: `Duplicate node ${node.id}` });
    nodeIds.add(node.id);
    if (node.kind === "specialBase" && !node.specialBaseEffect) {
      issues.push({ severity: "error", code: "specialBaseMissingEffect", message: `Special base ${node.id} has no specialBaseEffect.` });
    }
    if (node.placementRestriction?.kind === "allowedTroopForces" && (!Array.isArray(node.placementRestriction.allowedForces) || node.placementRestriction.allowedForces.length === 0)) {
      issues.push({ severity: "error", code: "emptyPlacementRestriction", message: `Node ${node.id} has an empty placement restriction.` });
    }
  }
  for (const edge of terrain.edges ?? []) {
    if (!nodeIds.has(edge.a) || !nodeIds.has(edge.b)) issues.push({ severity: "error", code: "edgeUnknownNode", message: `Edge ${edge.id} references an unknown node.` });
  }
  const baseIds = new Set(baseNodes(terrain).map((node) => node.id));
  const regionIds = new Set((terrain.regions ?? []).map((region) => region.id));
  for (const region of terrain.regions ?? []) {
    for (const baseId of region.boundaryBaseIds) {
      if (!baseIds.has(baseId)) issues.push({ severity: "error", code: "regionUnknownBase", message: `Region ${region.id} references unknown base ${baseId}.` });
    }
  }
  for (const medal of terrain.medalSpaces ?? []) {
    if (!regionIds.has(medal.regionId)) issues.push({ severity: "error", code: "medalUnknownRegion", message: `Medal ${medal.id} references unknown region.` });
  }
  for (const player of PLAYERS) {
    if (!hqNodes(terrain).some((node) => node.owner === player)) issues.push({ severity: "error", code: "missingHq", message: `Missing ${player} HQ.` });
    if (!terrain.objectives?.[player]?.requiredCount) issues.push({ severity: "error", code: "missingObjective", message: `Missing ${player} objective.` });
  }

  const specialRuleKinds = new Set((terrain.specialRules ?? []).map((rule) => rule.kind));
  const specialRuleEffects = new Set((terrain.specialRules ?? []).map((rule) => rule.effect).filter(Boolean));
  if (terrain.official && ["transcribed", "reviewed"].includes(terrain.transcriptionStatus)) {
    if (specialRuleEffects.size > 0 && specialBaseNodes(terrain).length === 0) {
      issues.push({ severity: "error", code: "specialRuleWithoutSpecialBase", message: "Official terrain declares special-base effects but has no special base nodes." });
    }
    if (specialRuleKinds.has("placementRestrictionsByNode")) {
      const restrictedNodes = terrain.nodes.filter((node) => node.placementRestriction?.kind === "allowedTroopForces");
      if (restrictedNodes.length === 0) {
        issues.push({ severity: "error", code: "missingPlacementRestrictionNodes", message: "Placement-restricted terrain has no restricted nodes." });
      }
    }
  }
  return { ok: issues.filter((issue) => issue.severity === "error").length === 0, issues };
}

export function validateGameState(state) {
  const issues = [];
  for (const player of PLAYERS) {
    if (state.players[player].support.length > SUPPORT_LIMIT) issues.push({ severity: "error", code: "supportTooLarge", message: `${player} support exceeds 8.` });
    const troopCounts = Object.fromEntries(TROOP_TYPES.map((type) => [type, 0]));
    for (const troop of Object.values(state.troops).filter((item) => item.owner === player)) troopCounts[troop.type] += 1;
    for (const [type, count] of Object.entries(troopCounts)) {
      if (count !== TROOP_CATALOG[type].copiesPerColor) issues.push({ severity: "error", code: "wrongTroopCount", message: `${player} has ${count} ${type}.` });
    }
  }
  for (const [baseId, stack] of Object.entries(state.board.stacks)) {
    for (const troopId of stack.troopIds) {
      const location = state.troops[troopId]?.location;
      if (!location || location.zone !== "stack" || location.nodeId !== baseId) {
        issues.push({ severity: "error", code: "stackLocationMismatch", message: `${troopId} location does not match stack ${baseId}.` });
      }
    }
  }
  if (state.winner && state.turn.phase !== "gameOver") issues.push({ severity: "error", code: "winnerWithoutGameOver", message: "Winner exists outside gameOver phase." });
  return { ok: issues.filter((issue) => issue.severity === "error").length === 0, issues };
}

export function serializeGame(state, savedAtIso = new Date(0).toISOString()) {
  return JSON.stringify({ schemaVersion: 1, savedAtIso, state });
}

export function deserializeGame(serialized) {
  const envelope = JSON.parse(serialized);
  if (envelope.schemaVersion !== 1) throw new Error(`Unsupported schema version ${envelope.schemaVersion}`);
  const validation = validateGameState(envelope.state);
  if (!validation.ok) throw new Error(`Invalid saved game: ${validation.issues.map((issue) => issue.code).join(", ")}`);
  return envelope.state;
}

export { syntheticMvpTerrain };
