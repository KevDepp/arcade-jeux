import { TROOP_CATALOG } from "./catalog.js";
import { drawTroops, listLegalActions, placeTroop } from "./engine.js";

const PLAYER_ORDER = Object.freeze(["blue", "red"]);
const SKIP_EFFECT = Object.freeze({ kind: "skip" });
const WIN_SCORE = 1_000_000;
const SUPPORT_LIMIT = 8;

function opponentOf(player) {
  return player === "blue" ? "red" : "blue";
}

function asTurn(state, player) {
  return { ...state, turn: { ...state.turn, currentPlayer: player } };
}

function actionKey(action) {
  if (!action) return "";
  if (action.kind === "draw") return `${action.player}:draw:${action.drawCount ?? 0}`;
  return `${action.player}:place:${action.targetNodeId}:${action.troopId}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getNode(state, nodeId) {
  return state.terrain.nodes.find((node) => node.id === nodeId) ?? null;
}

function adjacentNodeIds(state, nodeId) {
  const ids = [];
  for (const edge of state.terrain.edges) {
    if (edge.a === nodeId) ids.push(edge.b);
    if (edge.b === nodeId) ids.push(edge.a);
  }
  return ids;
}

function baseNodes(state) {
  return state.terrain.nodes.filter((node) => node.kind === "base" || node.kind === "specialBase");
}

function topTroopId(state, baseId) {
  return state.board.stacks[baseId]?.troopIds.at(-1) ?? null;
}

function occupyingPlayer(state, baseId) {
  const troopId = topTroopId(state, baseId);
  return troopId ? state.troops[troopId].owner : null;
}

function countControlledRegions(state, player) {
  return Object.values(state.board.controlledRegions).filter((controller) => controller === player).length;
}

function troopForceValue(state, troopId) {
  const troop = state.troops[troopId];
  if (!troop) return 0;
  const force = TROOP_CATALOG[troop.type]?.force;
  return typeof force === "number" ? force : 4;
}

function normalizeSearchConfig(config = {}) {
  return {
    maxDepth: Math.max(1, Math.floor(config.maxDepth ?? 2)),
    nodeBudget: Math.max(1, Math.floor(config.nodeBudget ?? 1_000)),
    timeLimitMs: Number.isFinite(config.timeLimitMs) ? Math.max(0, config.timeLimitMs) : Infinity,
    seed: String(config.seed ?? "strong-ai"),
  };
}

export function applyBaselineAction(state, action) {
  if (!action) {
    return { ok: false, state, events: [], error: { code: "missingAction", message: "No action was provided." } };
  }
  if (action.kind === "draw") return drawTroops(state, action.player);
  if (action.kind === "placeTroop") {
    return placeTroop(state, action.player, action.troopId, action.targetNodeId, action.effectChoice ?? SKIP_EFFECT);
  }
  return { ok: false, state, events: [], error: { code: "unknownAction", message: `Unknown action kind: ${action.kind}` } };
}

function immediateHqThreats(state, attackingPlayer, defendingPlayer = opponentOf(attackingPlayer), observerPlayer = defendingPlayer) {
  if (state.winner) return [];
  return legalAiActionsFor(state, attackingPlayer, observerPlayer)
    .filter((action) => {
      if (action.kind !== "placeTroop") return false;
      const target = getNode(state, action.targetNodeId);
      return target?.kind === "hq" && target.owner === defendingPlayer;
    })
    .map((action) => ({ kind: action.kind, player: action.player, targetNodeId: action.targetNodeId }));
}

function scorePlacementShape(state, action) {
  const target = getNode(state, action.targetNodeId);
  if (!target || target.kind === "hq") return 0;
  const currentOccupier = occupyingPlayer(state, action.targetNodeId);
  if (currentOccupier === opponentOf(action.player)) return 450;
  if (currentOccupier === action.player) return 120;
  return 260;
}

function scoreAction(state, player, action, initialOpponentHqThreats) {
  const result = applyBaselineAction(asTurn(state, player), action);
  if (!result.ok) {
    return {
      action,
      score: Number.NEGATIVE_INFINITY,
      reason: "illegal",
      details: { errorCode: result.error?.code },
    };
  }

  const opponent = opponentOf(player);
  const beforeMedals = state.players[player].medals.length;
  const afterMedals = result.state.players[player].medals.length;
  const medalGain = afterMedals - beforeMedals;
  const regionGain = countControlledRegions(result.state, player) - countControlledRegions(state, player);
  const target = action.kind === "placeTroop" ? getNode(state, action.targetNodeId) : null;
  const immediateHqWin = result.state.winner?.winner === player && result.state.winner.reason === "capturedEnemyHq";
  const immediateWin = result.state.winner?.winner === player;
  const remainingOpponentHqThreats = immediateHqThreats(result.state, opponent, player, player);
  const blocksImmediateHqThreat = initialOpponentHqThreats.length > 0 && remainingOpponentHqThreats.length === 0;

  let score = 0;
  if (immediateHqWin) score += 120000;
  else if (immediateWin) score += 100000;
  if (blocksImmediateHqThreat) score += 85000;
  score += medalGain * 5000;
  score += regionGain * 1800;

  if (action.kind === "placeTroop") {
    score += 1000;
    score += scorePlacementShape(state, action);
    if (target?.kind === "base") score += 20;
    score -= troopForceValue(state, action.troopId) * 5;
  } else if (action.kind === "draw") {
    score += (action.drawCount ?? 0) * 80;
  }

  let reason = "heuristic";
  if (immediateHqWin) reason = "immediateHqWin";
  else if (immediateWin) reason = "immediateWin";
  else if (blocksImmediateHqThreat) reason = "blockImmediateHqThreat";
  else if (medalGain > 0) reason = "medalProgress";
  else if (regionGain > 0) reason = "regionProgress";
  else if (action.kind === "draw") reason = "drawSupport";

  return {
    action: action.kind === "placeTroop" ? { ...action, effectChoice: SKIP_EFFECT } : { ...action },
    score,
    reason,
    details: {
      medalGain,
      regionGain,
      blocksImmediateHqThreat,
      immediateWin,
      remainingOpponentHqThreatCount: remainingOpponentHqThreats.length,
    },
  };
}

export function scoreBaselineAiActions(state, player = state.turn.currentPlayer) {
  if (state.winner) return [];
  if (!PLAYER_ORDER.includes(player)) return [];
  const legalActions = listLegalActions(asTurn(state, player), player);
  const initialOpponentHqThreats = immediateHqThreats(state, opponentOf(player), player, player);
  return legalActions
    .map((action) => scoreAction(state, player, action, initialOpponentHqThreats))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((a, b) => b.score - a.score || actionKey(a.action).localeCompare(actionKey(b.action)));
}

function rootRelativeWinnerScore(state, rootPlayer, ply) {
  if (!state.winner) return null;
  return state.winner.winner === rootPlayer ? WIN_SCORE - ply * 1000 : -WIN_SCORE + ply * 1000;
}

function actionVisibleToObserver(state, action, observerPlayer) {
  if (action.kind === "draw" || action.player === observerPlayer) return true;
  const slot = state.players[action.player]?.support.find((item) => item.troopId === action.troopId);
  return slot?.hiddenFromOpponent === false || state.troops[action.troopId]?.location?.visibility === "public";
}

function countMobility(state, player, observerPlayer = player) {
  return legalAiActionsFor(state, player, observerPlayer).length;
}

function countAdjacentEnemyHqPressure(state, player) {
  const opponent = opponentOf(player);
  const enemyHqIds = state.terrain.nodes
    .filter((node) => node.kind === "hq" && node.owner === opponent)
    .map((node) => node.id);
  let pressure = 0;
  for (const hqId of enemyHqIds) {
    for (const adjacent of adjacentNodeIds(state, hqId)) {
      if (occupyingPlayer(state, adjacent) === player) pressure += 1;
    }
  }
  return pressure;
}

function regionPotential(state, player) {
  let score = 0;
  for (const region of state.terrain.regions) {
    const unclaimed = region.medalSpaceIds.some((medalId) => state.board.unclaimedMedals[medalId]?.status === "unclaimed");
    let own = 0;
    let opponent = 0;
    for (const baseId of region.boundaryBaseIds) {
      const occupier = occupyingPlayer(state, baseId);
      if (occupier === player) own += 1;
      else if (occupier === opponentOf(player)) opponent += 1;
    }
    if (opponent === 0) score += own * (unclaimed ? 90 : 25);
    if (own === region.boundaryBaseIds.length && unclaimed) score += 450;
    if (own > 0 && opponent > 0) score -= opponent * 20;
  }
  return score;
}

function supportTroopVisibleToObserver(state, player, slot, observerPlayer) {
  if (player === observerPlayer) return true;
  return slot.hiddenFromOpponent === false || state.troops[slot.troopId]?.location?.visibility === "public";
}

function supportQuality(state, player, observerPlayer = player) {
  let score = 0;
  for (const slot of state.players[player].support) {
    if (slot.availability !== "available") continue;
    if (!supportTroopVisibleToObserver(state, player, slot, observerPlayer)) continue;
    const troop = state.troops[slot.troopId];
    const force = troopForceValue(state, slot.troopId);
    score += force * 12;
    if (["captaine", "mastok", "xb42", "star", "skully"].includes(troop.type)) score += 18;
    if (troop.type === "crochet") score += 14;
    if (troop.type === "kwak") score += 20;
  }
  return score;
}

function boardCoveragePressure(state, player) {
  let score = 0;
  for (const node of baseNodes(state)) {
    const topId = topTroopId(state, node.id);
    if (!topId) continue;
    const owner = state.troops[topId].owner;
    const force = troopForceValue(state, topId);
    score += owner === player ? 35 + force * 5 : -(35 + force * 5);
  }
  return score;
}

export function evaluateAiState(state, player) {
  const terminal = rootRelativeWinnerScore(state, player, 0);
  if (terminal !== null) return terminal;

  const opponent = opponentOf(player);
  const medalScore = (state.players[player].medals.length - state.players[opponent].medals.length) * 6000;
  const objectiveProgress =
    (state.players[player].medals.length / Math.max(1, state.players[player].objectiveMedals)
      - state.players[opponent].medals.length / Math.max(1, state.players[opponent].objectiveMedals)) * 1200;
  const regionScore = regionPotential(state, player) - regionPotential(state, opponent);
  const mobilityScore = (countMobility(state, player, player) - countMobility(state, opponent, player)) * 25;
  const supportScore = supportQuality(state, player, player) - supportQuality(state, opponent, player);
  const coverageScore = boardCoveragePressure(state, player);
  const hqPressureScore = (countAdjacentEnemyHqPressure(state, player) - countAdjacentEnemyHqPressure(state, opponent)) * 700;
  return medalScore + objectiveProgress + regionScore + mobilityScore + supportScore + coverageScore + hqPressureScore;
}

function legalAiActionsFor(state, player, observerPlayer = player) {
  if (player !== observerPlayer) {
    const visibleSupportIds = new Set(
      state.players[player].support
        .filter((slot) => slot.availability === "available" && supportTroopVisibleToObserver(state, player, slot, observerPlayer))
        .map((slot) => slot.troopId),
    );
    const visibleActions = [];
    const drawCapacity = SUPPORT_LIMIT - state.players[player].support.length;
    if (drawCapacity > 0 && state.players[player].reserve.length > 0) {
      visibleActions.push({ kind: "draw", player, drawCount: Math.min(2, drawCapacity, state.players[player].reserve.length) });
    }
    if (visibleSupportIds.size === 0) return visibleActions;
    return listLegalActions(asTurn(state, player), player)
      .filter((action) => action.kind === "draw" || visibleSupportIds.has(action.troopId))
      .map((action) => action.kind === "placeTroop" ? { ...action, effectChoice: SKIP_EFFECT } : { ...action });
  }
  return listLegalActions(asTurn(state, player), player)
    .filter((action) => actionVisibleToObserver(state, action, observerPlayer))
    .map((action) => action.kind === "placeTroop" ? { ...action, effectChoice: SKIP_EFFECT } : { ...action });
}

function orderSearchActions(state, rootPlayer, player, actions) {
  return actions
    .map((action) => {
      const result = applyBaselineAction(asTurn(state, player), action);
      const score = result.ok ? evaluateAiState(result.state, rootPlayer) : Number.NEGATIVE_INFINITY;
      return { action, score };
    })
    .sort((a, b) => {
      const scoreCompare = player === rootPlayer ? b.score - a.score : a.score - b.score;
      return scoreCompare || actionKey(a.action).localeCompare(actionKey(b.action));
    })
    .map((item) => item.action);
}

function searchStopped(context) {
  if (context.nodesVisited >= context.nodeBudget) {
    context.exhausted = true;
    return true;
  }
  if (Date.now() >= context.deadlineMs) {
    context.timedOut = true;
    return true;
  }
  return false;
}

function minimax(state, rootPlayer, playerToMove, depthRemaining, alpha, beta, context, ply) {
  context.nodesVisited += 1;
  const terminalScore = rootRelativeWinnerScore(state, rootPlayer, ply);
  if (terminalScore !== null || depthRemaining <= 0 || searchStopped(context)) {
    return terminalScore ?? evaluateAiState(state, rootPlayer);
  }

  const actions = orderSearchActions(state, rootPlayer, playerToMove, legalAiActionsFor(state, playerToMove, rootPlayer));
  if (actions.length === 0) return evaluateAiState(state, rootPlayer);

  if (playerToMove === rootPlayer) {
    let best = Number.NEGATIVE_INFINITY;
    for (const action of actions) {
      if (searchStopped(context)) break;
      const result = applyBaselineAction(asTurn(state, playerToMove), action);
      if (!result.ok) continue;
      const score = minimax(result.state, rootPlayer, result.state.turn.currentPlayer, depthRemaining - 1, alpha, beta, context, ply + 1);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (alpha >= beta) {
        context.alphaBetaCutoffs += 1;
        break;
      }
    }
    return best;
  }

  let best = Number.POSITIVE_INFINITY;
  for (const action of actions) {
    if (searchStopped(context)) break;
    const result = applyBaselineAction(asTurn(state, playerToMove), action);
    if (!result.ok) continue;
    const score = minimax(result.state, rootPlayer, result.state.turn.currentPlayer, depthRemaining - 1, alpha, beta, context, ply + 1);
    best = Math.min(best, score);
    beta = Math.min(beta, best);
    if (alpha >= beta) {
      context.alphaBetaCutoffs += 1;
      break;
    }
  }
  return best;
}

function searchRoot(state, player, depth, context) {
  const rootActions = orderSearchActions(state, player, player, legalAiActionsFor(state, player));
  let best = null;
  for (const action of rootActions) {
    if (searchStopped(context)) break;
    const result = applyBaselineAction(asTurn(state, player), action);
    if (!result.ok) continue;
    const terminalScore = rootRelativeWinnerScore(result.state, player, 1);
    const score = terminalScore ?? minimax(result.state, player, result.state.turn.currentPlayer, depth - 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, context, 1);
    const candidate = { action, score, depth };
    if (!best || score > best.score || (score === best.score && actionKey(action).localeCompare(actionKey(best.action)) < 0)) {
      best = candidate;
    }
  }
  return best;
}

export function chooseStrongAiAction(state, player = state.turn.currentPlayer, config = {}) {
  if (state.winner) {
    return { ok: false, action: null, reason: "gameOver", score: null, candidates: [], search: null };
  }

  const normalized = normalizeSearchConfig(config);
  const initialActions = legalAiActionsFor(state, player);
  if (initialActions.length === 0) {
    return { ok: false, action: null, reason: "noLegalActions", score: null, candidates: [], search: null };
  }

  const baselineCandidates = scoreBaselineAiActions(state, player);
  const immediateHqWin = baselineCandidates.find((candidate) => candidate.reason === "immediateHqWin");
  if (immediateHqWin) {
    return {
      ok: true,
      action: immediateHqWin.action,
      reason: "searchImmediateWin",
      score: WIN_SCORE,
      candidates: [{ action: immediateHqWin.action, score: WIN_SCORE, depth: 0 }],
      search: {
        algorithm: "minimax-alpha-beta",
        maxDepth: normalized.maxDepth,
        completedDepth: 0,
        selectedDepth: 0,
        nodeBudget: normalized.nodeBudget,
        nodesVisited: 0,
        exhausted: false,
        timeLimitMs: normalized.timeLimitMs,
        timedOut: false,
        alphaBetaCutoffs: 0,
        seed: normalized.seed,
      },
    };
  }
  let best = baselineCandidates.length > 0
    ? { action: baselineCandidates[0].action, score: baselineCandidates[0].score, depth: 0 }
    : { action: orderSearchActions(state, player, player, initialActions)[0], score: evaluateAiState(state, player), depth: 0 };
  const context = {
    nodeBudget: normalized.nodeBudget,
    deadlineMs: normalized.timeLimitMs === Infinity ? Infinity : Date.now() + normalized.timeLimitMs,
    nodesVisited: 0,
    alphaBetaCutoffs: 0,
    exhausted: false,
    timedOut: false,
  };

  let completedDepth = 0;
  for (let depth = 1; depth <= normalized.maxDepth; depth += 1) {
    const depthBest = searchRoot(clone(state), player, depth, context);
    if (depthBest) best = depthBest;
    if (context.exhausted || context.timedOut) break;
    completedDepth = depth;
  }

  const reason = best.depth === 0
    ? "baselineFallback"
    : best.score >= WIN_SCORE / 2
      ? "searchImmediateWin"
      : "search";
  return {
    ok: true,
    action: best.action,
    reason,
    score: best.score,
    candidates: [{ action: best.action, score: best.score, depth: best.depth }],
    search: {
      algorithm: "minimax-alpha-beta",
      maxDepth: normalized.maxDepth,
      completedDepth,
      selectedDepth: best.depth,
      nodeBudget: normalized.nodeBudget,
      nodesVisited: context.nodesVisited,
      exhausted: context.exhausted,
      timeLimitMs: normalized.timeLimitMs,
      timedOut: context.timedOut,
      alphaBetaCutoffs: context.alphaBetaCutoffs,
      seed: normalized.seed,
    },
  };
}

export function applyStrongAiAction(state, player = state.turn.currentPlayer, config = {}) {
  const choice = chooseStrongAiAction(state, player, config);
  if (!choice.ok) {
    return {
      ok: false,
      state,
      events: [],
      choice,
      error: { code: choice.reason, message: "Strong AI could not choose an action." },
    };
  }
  const result = applyBaselineAction(asTurn(state, player), choice.action);
  return { ...result, choice };
}

export function chooseBaselineAiAction(state, player = state.turn.currentPlayer) {
  if (state.winner) {
    return { ok: false, action: null, reason: "gameOver", score: null, candidates: [] };
  }
  const candidates = scoreBaselineAiActions(state, player);
  if (candidates.length === 0) {
    return { ok: false, action: null, reason: "noLegalActions", score: null, candidates: [] };
  }
  const best = candidates[0];
  return {
    ok: true,
    action: best.action,
    reason: best.reason,
    score: best.score,
    candidates,
  };
}

export function applyBaselineAiAction(state, player = state.turn.currentPlayer) {
  const choice = chooseBaselineAiAction(state, player);
  if (!choice.ok) {
    return {
      ok: false,
      state,
      events: [],
      choice,
      error: { code: choice.reason, message: "Baseline AI could not choose an action." },
    };
  }
  const result = applyBaselineAction(asTurn(state, player), choice.action);
  return { ...result, choice };
}
