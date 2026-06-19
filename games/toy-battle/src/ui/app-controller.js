import {
  applyStrongAiAction,
  drawTroops,
  listLegalActions,
  placeTroop,
  setupGame,
  syntheticMvpTerrain,
  TROOP_CATALOG,
} from "../engine/index.js";
import {
  UI_ACTION_TYPES,
  UI_PHASES,
  createPublicGameView,
  createUiPhaseState,
} from "./action-protocol.js";
import {
  TUTORIAL_IDS,
  TUTORIAL_STEP_IDS,
  advanceTutorialSession,
  createTutorialSession,
  currentTutorialStep,
  tutorialTargetsForSession,
  tutorialProgressLabel,
} from "./tutorial.js";

export const HUMAN_PLAYER = "blue";
export const AI_PLAYER = "red";
export const DEFAULT_AI_DELAY_MS = 260;
export const DEFAULT_ANIMATION_DELAY_MS = 220;
export const DEFAULT_PROMPT = "A vous de choisir: piocher ou selectionner une troupe.";

function defaultSchedule(callback, delayMs) {
  return globalThis.setTimeout(callback, delayMs);
}

function defaultResetSeed() {
  return `ui-game-${Date.now()}`;
}

export function createToyBattleUiController(options = {}) {
  const schedule = options.schedule ?? defaultSchedule;
  const onChange = options.onChange ?? (() => {});
  const aiDelayMs = options.aiDelayMs ?? DEFAULT_AI_DELAY_MS;
  const animationDelayMs = options.animationDelayMs ?? DEFAULT_ANIMATION_DELAY_MS;
  const resetSeed = options.resetSeed ?? defaultResetSeed;
  const aiConfig = options.aiConfig ?? { maxDepth: 2, nodeBudget: 180, seed: "ui-ai" };
  const gameTerrain = options.terrain ?? syntheticMvpTerrain;
  const gameMode = options.mode ?? "vs-computer";

  let engineState = setupGame({
    terrain: gameTerrain,
    seed: options.seed ?? "ui-game",
    firstPlayer: HUMAN_PLAYER,
  }).state;
  let selectedTroopId = null;
  let inspectedNodeId = null;
  let effectMode = "apply";
  let phase = UI_PHASES.IDLE;
  let promptText = gameMode === "vs-human" ? `Joueur Bleu : ${DEFAULT_PROMPT}` : DEFAULT_PROMPT;
  let notice = "";
  let tutorial = null;
  let pendingFirstPlacement = null;
  let speculativeState = null;
  let isAdditionalPlacementStep = false;

  function emit() {
    onChange(getSnapshot());
  }

  function legalActionsForHuman() {
    const actingPlayer = engineState.turn.currentPlayer;
    const currentState = speculativeState || engineState;
    if (gameMode === "vs-computer") {
      if (actingPlayer !== HUMAN_PLAYER || engineState.winner) return [];
      return listLegalActions(currentState, HUMAN_PLAYER);
    } else {
      if (engineState.winner) return [];
      return listLegalActions(currentState, actingPlayer);
    }
  }

  function isLegalPlacement(nodeId) {
    if (!selectedTroopId) return false;
    return legalActionsForHuman().some(
      (action) => action.kind === "placeTroop" && action.troopId === selectedTroopId && action.targetNodeId === nodeId,
    );
  }

  function currentPhaseState() {
    const viewer = gameMode === "vs-human" ? engineState.turn.currentPlayer : HUMAN_PLAYER;
    let stateForPhase = engineState;
    if (speculativeState) {
      stateForPhase = JSON.parse(JSON.stringify(speculativeState));
      stateForPhase.turn.currentPlayer = engineState.turn.currentPlayer;
      stateForPhase.turn.turnNumber = engineState.turn.turnNumber;
      stateForPhase.winner = null;
    }
    return createUiPhaseState({
      state: stateForPhase,
      viewer,
      phase,
      selectedTroopId,
      inspectedNodeId,
      prompt: promptText,
    });
  }

  function canUseHumanControls() {
    return currentPhaseState().canInteract;
  }

  function isTutorialActive() {
    return Boolean(tutorial?.active);
  }

  function troopType(troopId) {
    return engineState.troops[troopId]?.type ?? null;
  }

  function nodeById(nodeId) {
    return engineState.terrain.nodes.find((node) => node.id === nodeId) ?? null;
  }

  function adjacentNodeIds(nodeId) {
    return engineState.terrain.edges
      .filter((edge) => edge.a === nodeId || edge.b === nodeId)
      .map((edge) => edge.a === nodeId ? edge.b : edge.a);
  }

  function topTroopIdAt(nodeId) {
    return engineState.board.stacks[nodeId]?.troopIds.at(-1) ?? null;
  }

  function firstAdjacentVisibleEnemyTroop(state, targetNodeId, player) {
    return adjacentNodeIds(targetNodeId)
      .map((nodeId) => state.board.stacks[nodeId]?.troopIds.at(-1) ?? null)
      .find((troopId) => troopId && state.troops[troopId]?.owner !== player) ?? null;
  }

  function selectedTroopHasOptionalEffect() {
    const type = troopType(selectedTroopId);
    const effect = type ? TROOP_CATALOG[type]?.effect : null;
    return Boolean(effect?.optional);
  }

  function buildAutomaticChoice(state, player, troopId, targetNodeId, visited = new Set()) {
    if (visited.has(troopId)) return { kind: "skip" };
    visited.add(troopId);

    const troop = state.troops[troopId];
    const type = troop?.type;
    if (!type) return { kind: "skip" };

    let choice = { kind: "skip" };

    if (type === "skully" || type === "star") {
      choice = { kind: "draw" };
    } else if (type === "xb42") {
      choice = { kind: "discardRandomOpponentSupport" };
    } else if (type === "mastok") {
      const enemyId = firstAdjacentVisibleEnemyTroop(state, targetNodeId, player);
      choice = enemyId ? { kind: "selectTroop", troopId: enemyId } : { kind: "skip" };
    } else if (type === "captaine") {
      const tempState = JSON.parse(JSON.stringify(state));
      tempState.turn.currentPlayer = player;
      const placeRes = placeTroop(tempState, player, troopId, targetNodeId, { kind: "skip" });
      if (placeRes.ok) {
        const nextLegalActions = listLegalActions(placeRes.state, player);
        const addAction = nextLegalActions.find(
          (action) => action.kind === "placeTroop" && !visited.has(action.troopId)
        );
        if (addAction) {
          choice = {
            kind: "placeAdditionalTroop",
            troopId: addAction.troopId,
            targetNodeId: addAction.targetNodeId,
            effect: buildAutomaticChoice(placeRes.state, player, addAction.troopId, addAction.targetNodeId, visited),
          };
        }
      }
    }

    const targetNode = state.terrain.nodes.find((n) => n.id === targetNodeId);
    if (targetNode?.specialBaseEffect?.kind === "recoverOwnDiscardToSupport") {
      const discardTroopId = state.players[player].discard[0];
      if (discardTroopId) choice.baseEffect = { kind: "recoverOwnDiscardToSupport", troopId: discardTroopId };
    } else if (targetNode?.specialBaseEffect?.kind === "drawOneFromReserve") {
      choice.baseEffect = { kind: "draw" };
    }

    return choice;
  }

  function buildEffectChoice(targetNodeId) {
    if (effectMode !== "apply") return { kind: "skip" };
    return buildAutomaticChoice(engineState, engineState.turn.currentPlayer, selectedTroopId, targetNodeId);
  }

  function currentTutorialTargets() {
    return tutorialTargetsForSession(tutorial);
  }

  function isCemeteryTutorial() {
    return tutorial?.tutorialId === TUTORIAL_IDS.CEMETERY;
  }

  function firstSupportTroopByType(player, type) {
    return engineState.players[player].support.find((slot) => slot.availability === "available" && troopType(slot.troopId) === type)?.troopId ?? null;
  }

  function removeTroopEverywhere(troopId) {
    for (const player of [HUMAN_PLAYER, AI_PLAYER]) {
      engineState.players[player].reserve = engineState.players[player].reserve.filter((id) => id !== troopId);
      engineState.players[player].support = engineState.players[player].support.filter((slot) => slot.troopId !== troopId);
      engineState.players[player].discard = engineState.players[player].discard.filter((id) => id !== troopId);
      engineState.players[player].removedFromGame = engineState.players[player].removedFromGame.filter((id) => id !== troopId);
    }
    for (const stack of Object.values(engineState.board.stacks)) {
      stack.troopIds = stack.troopIds.filter((id) => id !== troopId);
    }
  }

  function setStackForTutorial(baseId, troopId) {
    removeTroopEverywhere(troopId);
    engineState.board.stacks[baseId].troopIds = [troopId];
    engineState.troops[troopId].location = { zone: "stack", nodeId: baseId, depth: 0, visibility: "public" };
  }

  function putInSupportForTutorial(player, troopId) {
    removeTroopEverywhere(troopId);
    engineState.players[player].support.push({ troopId, availability: "available", hiddenFromOpponent: true });
    engineState.troops[troopId].location = {
      zone: "support",
      owner: player,
      index: engineState.players[player].support.length - 1,
      visibility: "ownerOnly",
    };
  }

  function putInDiscardForTutorial(player, troopId) {
    removeTroopEverywhere(troopId);
    engineState.players[player].discard.push(troopId);
    engineState.troops[troopId].location = {
      zone: "discard",
      owner: player,
      index: engineState.players[player].discard.length - 1,
      visibility: "public",
    };
  }

  function firstTroopForTutorial(player, predicate, excluded = new Set()) {
    return Object.values(engineState.troops).find((troop) => (
      troop.owner === player &&
      !excluded.has(troop.id) &&
      troop.location.zone !== "support" &&
      troop.location.zone !== "stack" &&
      predicate(troop)
    ))?.id ?? null;
  }

  function ensureSupportTroopForTutorial(player, type) {
    const existing = firstSupportTroopByType(player, type);
    if (existing) return existing;
    const troopId = firstTroopForTutorial(player, (troop) => troop.type === type);
    if (!troopId) return null;
    putInSupportForTutorial(player, troopId);
    return troopId;
  }

  function prepareCemeteryTutorialRoute() {
    const targets = currentTutorialTargets();
    ensureSupportTroopForTutorial(HUMAN_PLAYER, targets.openingTroopType);
    ensureSupportTroopForTutorial(HUMAN_PLAYER, targets.coverTroopType);
    ensureSupportTroopForTutorial(HUMAN_PLAYER, targets.specialEffectTroopType);
    ensureSupportTroopForTutorial(AI_PLAYER, targets.redDemoTroopType);

    const protectedIds = new Set([
      ...engineState.players[HUMAN_PLAYER].support.map((slot) => slot.troopId),
      ...engineState.players[AI_PLAYER].support.map((slot) => slot.troopId),
    ]);
    for (const baseId of [
      "p_top_center_square",
      "p_mid_right_square",
      "p_center_square",
      "p_lower_right_square",
      "p_bottom_center_square",
      "p_bottom_right_square",
    ]) {
      const troopId = firstTroopForTutorial(HUMAN_PLAYER, () => true, protectedIds);
      if (!troopId) {
        setTutorialFeedback("Tutorial setup failed: not enough blue troops for the cemetery route.");
        return false;
      }
      protectedIds.add(troopId);
      setStackForTutorial(baseId, troopId);
    }

    const discardTroop = firstTroopForTutorial(HUMAN_PLAYER, () => true, protectedIds);
    if (discardTroop) putInDiscardForTutorial(HUMAN_PLAYER, discardTroop);
    return true;
  }

  function setTutorialFeedback(message) {
    if (!tutorial) return;
    tutorial = { ...tutorial, feedback: message };
    notice = message;
  }

  function stepPrompt(step = currentTutorialStep(tutorial)) {
    if (!step) return DEFAULT_PROMPT;
    return `${step.title}: ${step.text}`;
  }

  function tutorialCanDraw() {
    return !isTutorialActive() || currentTutorialStep(tutorial)?.id === TUTORIAL_STEP_IDS.DRAW;
  }

  function tutorialCanSelectTroop(troopId) {
    if (!isTutorialActive()) return true;
    const step = currentTutorialStep(tutorial);
    const targets = currentTutorialTargets();
    if (step?.id === TUTORIAL_STEP_IDS.SELECT_OPENING) {
      return troopId === firstSupportTroopByType(HUMAN_PLAYER, targets.openingTroopType);
    }
    if (step?.id === TUTORIAL_STEP_IDS.SELECT_COVER) {
      return troopId === firstSupportTroopByType(HUMAN_PLAYER, targets.coverTroopType);
    }
    if (step?.id === TUTORIAL_STEP_IDS.SELECT_SPECIAL) {
      return troopId === firstSupportTroopByType(HUMAN_PLAYER, targets.specialEffectTroopType);
    }
    return false;
  }

  function tutorialCanPlaceNode(nodeId) {
    if (!isTutorialActive()) return true;
    const step = currentTutorialStep(tutorial);
    const targets = currentTutorialTargets();
    return (
      (step?.id === TUTORIAL_STEP_IDS.PLACE_OPENING && nodeId === targets.openingNodeId) ||
      (step?.id === TUTORIAL_STEP_IDS.PLACE_COVER && nodeId === targets.coverNodeId) ||
      (step?.id === TUTORIAL_STEP_IDS.PLACE_SPECIAL && nodeId === targets.taughtSpecialBaseId)
    );
  }

  function isTutorialHighlightedSupport(troopId) {
    return isTutorialActive() && tutorialCanSelectTroop(troopId);
  }

  function isTutorialHighlightedNode(nodeId) {
    if (!isTutorialActive()) return false;
    const step = currentTutorialStep(tutorial);
    return step?.nodeId === nodeId;
  }

  function tutorialActionFeedback(intent) {
    const step = currentTutorialStep(tutorial);
    if (!step) return "";
    if (step.id === TUTORIAL_STEP_IDS.DRAW) return "Draw is the guided action for this step.";
    if (step.id === TUTORIAL_STEP_IDS.SELECT_OPENING) return "Select the highlighted Skully first.";
    if (step.id === TUTORIAL_STEP_IDS.PLACE_OPENING) return "Place on the highlighted connected base.";
    if (step.id === TUTORIAL_STEP_IDS.AI_DRAW_REPLY || step.id === TUTORIAL_STEP_IDS.AI_PLACE_REPLY) return "Read the AI explanation, then use Next.";
    if (step.id === TUTORIAL_STEP_IDS.SELECT_COVER) return "Select the highlighted Star for the cover lesson.";
    if (step.id === TUTORIAL_STEP_IDS.PLACE_COVER) return "Cover the highlighted red troop.";
    if (step.id === TUTORIAL_STEP_IDS.INVALID_PLACEMENT) return "Use the tutorial Try button to inspect why the far base is blocked.";
    if (step.id === TUTORIAL_STEP_IDS.KWAK_LESSON || step.id === TUTORIAL_STEP_IDS.QG_THREAT) return "Read this rule card, then use Next.";
    if (step.id === TUTORIAL_STEP_IDS.SELECT_SPECIAL) return "Select the highlighted Kwak for the cemetery special-base lesson.";
    if (step.id === TUTORIAL_STEP_IDS.PLACE_SPECIAL) return "Place on the highlighted pumpkin special base.";
    if (intent?.type) return "Use the tutorial panel for this step.";
    return "";
  }

  function isTutorialIntentAllowed(intent) {
    if (!isTutorialActive()) return true;
    if (intent.type === UI_ACTION_TYPES.DRAW) return tutorialCanDraw();
    if (intent.type === UI_ACTION_TYPES.SELECT_TROOP) return tutorialCanSelectTroop(intent.payload.troopId);
    if (intent.type === UI_ACTION_TYPES.PLACE_TROOP) return tutorialCanPlaceNode(intent.payload.targetNodeId);
    return [
      UI_ACTION_TYPES.RESET_GAME,
      UI_ACTION_TYPES.START_GAME,
      UI_ACTION_TYPES.ADVANCE_TUTORIAL,
      UI_ACTION_TYPES.EXIT_TUTORIAL,
      UI_ACTION_TYPES.EXPLAIN_INVALID_PLACEMENT,
    ].includes(intent.type);
  }

  function startTutorial() {
    const tutorialId = gameTerrain.id === "le-cimetiere-maudit" ? TUTORIAL_IDS.CEMETERY : TUTORIAL_IDS.SYNTHETIC;
    const nextTutorial = createTutorialSession(tutorialId);
    const targets = tutorialTargetsForSession(nextTutorial);
    const tutorialTerrain = tutorialId === TUTORIAL_IDS.CEMETERY ? gameTerrain : syntheticMvpTerrain;
    engineState = setupGame({ terrain: tutorialTerrain, seed: targets.seed, firstPlayer: HUMAN_PLAYER }).state;
    selectedTroopId = null;
    phase = UI_PHASES.IDLE;
    tutorial = nextTutorial;
    pendingFirstPlacement = null;
    speculativeState = null;
    isAdditionalPlacementStep = false;
    promptText = stepPrompt();
    notice = "";
    emit();
  }

  function exitTutorial() {
    tutorial = null;
    selectedTroopId = null;
    pendingFirstPlacement = null;
    speculativeState = null;
    isAdditionalPlacementStep = false;
    phase = engineState.winner ? UI_PHASES.GAME_OVER : UI_PHASES.IDLE;
    promptText = engineState.winner ? "Game over." : "Tutorial closed. Continue playing or reset.";
    notice = "";
    emit();
  }

  function advanceTutorialStep() {
    if (!tutorial) return;
    const step = currentTutorialStep(tutorial);
    if (step.id === TUTORIAL_STEP_IDS.COMPLETE) {
      exitTutorial();
      return;
    }
    if (step.id === TUTORIAL_STEP_IDS.INVALID_PLACEMENT && !tutorial.feedback) {
      explainInvalidTutorialPlacement();
      return;
    }
    tutorial = advanceTutorialSession(tutorial);
    promptText = stepPrompt();
    notice = "";
    emit();
  }

  function explainInvalidTutorialPlacement() {
    const message = isCemeteryTutorial()
      ? "La dalle bord gauche reste interdite: une pose doit etre connectee au Q.G. par vos propres bases; les bases vides ou rouges coupent la chaine."
      : "B4 stays disabled: your path is Blue Q.G. -> b1, but red controls b2, so the connection is broken.";
    setTutorialFeedback(message);
    promptText = message;
    emit();
  }

  function resetGame() {
    engineState = setupGame({ terrain: gameTerrain, seed: resetSeed(), firstPlayer: HUMAN_PLAYER }).state;
    selectedTroopId = null;
    inspectedNodeId = null;
    effectMode = "apply";
    phase = UI_PHASES.IDLE;
    tutorial = null;
    pendingFirstPlacement = null;
    speculativeState = null;
    isAdditionalPlacementStep = false;
    const currentPlayerLabel = engineState.turn.currentPlayer === "blue" ? "Joueur Bleu" : "Joueur Rouge";
    promptText = gameMode === "vs-human"
      ? `Nouvelle partie prete. ${currentPlayerLabel} : piocher ou selectionnez une troupe.`
      : "Nouvelle partie prete. Piochez ou selectionnez une troupe.";
    notice = "";
    emit();
  }

  function applyTutorialResult(result, failureMessage) {
    if (!result.ok) {
      phase = UI_PHASES.IDLE;
      setTutorialFeedback(`${failureMessage} ${result.error?.message ?? ""}`.trim());
      emit();
      return false;
    }
    engineState = result.state;
    phase = engineState.winner ? UI_PHASES.GAME_OVER : UI_PHASES.IDLE;
    return true;
  }

  function runTutorialRedDraw() {
    if (engineState.turn.currentPlayer !== AI_PLAYER) return true;
    return applyTutorialResult(drawTroops(engineState, AI_PLAYER), "Tutorial red draw failed.");
  }

  function runTutorialRedPlacement() {
    if (engineState.turn.currentPlayer !== AI_PLAYER) return true;
    const targets = currentTutorialTargets();
    const troopId = firstSupportTroopByType(AI_PLAYER, targets.redDemoTroopType);
    if (!troopId) {
      setTutorialFeedback("Tutorial setup failed: red Crochet is missing.");
      return false;
    }
    return applyTutorialResult(
      placeTroop(engineState, AI_PLAYER, troopId, targets.redDemoNodeId, { kind: "skip" }),
      "Tutorial red placement failed.",
    );
  }

  function dispatchTutorialIntent(intent) {
    const step = currentTutorialStep(tutorial);
    if (intent.type === UI_ACTION_TYPES.DRAW && step?.id === TUTORIAL_STEP_IDS.DRAW) {
      if (!applyTutorialResult(drawTroops(engineState, HUMAN_PLAYER), "Tutorial draw failed.")) return;
      if (!runTutorialRedDraw()) return;
      if (isCemeteryTutorial() && !prepareCemeteryTutorialRoute()) return;
      tutorial = advanceTutorialSession(tutorial);
      promptText = stepPrompt();
      notice = "";
      emit();
      return;
    }

    if (intent.type === UI_ACTION_TYPES.SELECT_TROOP) {
      selectedTroopId = intent.payload.troopId;
      inspectedNodeId = null;
      effectMode = "apply";
      phase = UI_PHASES.SELECTING;
      tutorial = advanceTutorialSession(tutorial);
      promptText = stepPrompt();
      notice = "";
      emit();
      return;
    }

    if (intent.type === UI_ACTION_TYPES.PLACE_TROOP && selectedTroopId) {
      const placedNodeId = intent.payload.targetNodeId;
      phase = UI_PHASES.RESOLVING_EFFECT;
      emit();
      const stepId = currentTutorialStep(tutorial)?.id;
      const effectChoice = stepId === TUTORIAL_STEP_IDS.PLACE_SPECIAL
        ? { kind: "skip", baseEffect: { kind: "recoverOwnDiscardToSupport", troopId: engineState.players[HUMAN_PLAYER].discard[0] } }
        : { kind: "skip" };
      if (!applyTutorialResult(placeTroop(engineState, HUMAN_PLAYER, selectedTroopId, placedNodeId, effectChoice), "Tutorial placement failed.")) return;
      selectedTroopId = null;
      inspectedNodeId = null;
      effectMode = "apply";
      const targets = currentTutorialTargets();
      if (placedNodeId === targets.openingNodeId && !runTutorialRedPlacement()) return;
      if (placedNodeId === targets.coverNodeId && !runTutorialRedDraw()) return;
      tutorial = advanceTutorialSession(tutorial);
      promptText = stepPrompt();
      notice = "";
      emit();
    }
  }

  function applyEngineResult(result, failureMessage) {
    if (!result.ok) {
      phase = UI_PHASES.IDLE;
      promptText = `${failureMessage} ${result.error?.message ?? ""}`.trim();
      notice = promptText;
      emit();
      return;
    }
    engineState = result.state;
    phase = engineState.winner ? UI_PHASES.GAME_OVER : UI_PHASES.ANIMATING;
    inspectedNodeId = null;
    promptText = engineState.winner ? "Partie terminee." : "Resolution du tour.";
    notice = "";
    emit();
    schedule(afterHumanAnimation, animationDelayMs);
  }

  function afterHumanAnimation() {
    if (engineState.winner) {
      phase = UI_PHASES.GAME_OVER;
      const winnerLabel = engineState.winner.winner === "blue" ? "Joueur Bleu" : "Joueur Rouge";
      promptText = `${winnerLabel} gagne.`;
      emit();
      return;
    }
    if (gameMode === "vs-computer" && engineState.turn.currentPlayer === AI_PLAYER) {
      runAiTurn();
      return;
    }
    phase = UI_PHASES.IDLE;
    const currentPlayerLabel = engineState.turn.currentPlayer === "blue" ? "Joueur Bleu" : "Joueur Rouge";
    promptText = gameMode === "vs-human" ? `${currentPlayerLabel} : ${DEFAULT_PROMPT}` : DEFAULT_PROMPT;
    emit();
  }

  function runAiTurn() {
    phase = UI_PHASES.AI_THINKING;
    promptText = "L'IA choisit une action legale.";
    emit();
    schedule(() => {
      const result = applyStrongAiAction(engineState, AI_PLAYER, aiConfig);
      if (!result.ok) {
        notice = `AI could not act: ${result.error?.message ?? result.error?.code}`;
        phase = UI_PHASES.IDLE;
        emit();
        return;
      }
      engineState = result.state;
      phase = engineState.winner ? UI_PHASES.GAME_OVER : UI_PHASES.IDLE;
      promptText = engineState.winner ? `${engineState.winner.winner} gagne.` : "A vous de jouer.";
      emit();
    }, aiDelayMs);
  }

  function dispatch(intent) {
    if (intent.type === UI_ACTION_TYPES.RESET_GAME || intent.type === UI_ACTION_TYPES.START_GAME) {
      resetGame();
      return;
    }
    if (intent.type === UI_ACTION_TYPES.START_TUTORIAL) {
      startTutorial();
      return;
    }
    if (intent.type === UI_ACTION_TYPES.ADVANCE_TUTORIAL) {
      advanceTutorialStep();
      return;
    }
    if (intent.type === UI_ACTION_TYPES.EXIT_TUTORIAL) {
      exitTutorial();
      return;
    }
    if (intent.type === UI_ACTION_TYPES.EXPLAIN_INVALID_PLACEMENT) {
      explainInvalidTutorialPlacement();
      return;
    }
    if (intent.type === UI_ACTION_TYPES.INSPECT_NODE) {
      if (inspectedNodeId === intent.payload.nodeId) return;
      inspectedNodeId = intent.payload.nodeId ?? null;
      emit();
      return;
    }
    if (intent.type === UI_ACTION_TYPES.CLEAR_INSPECTION) {
      inspectedNodeId = null;
      emit();
      return;
    }
    if (intent.type === UI_ACTION_TYPES.APPLY_EFFECT && selectedTroopHasOptionalEffect()) {
      effectMode = "apply";
      notice = "Effet regle sur appliquer si une cible valide existe.";
      emit();
      return;
    }
    if (intent.type === UI_ACTION_TYPES.SKIP_EFFECT) {
      if (isAdditionalPlacementStep) {
        const currentPlayer = engineState.turn.currentPlayer;
        const result = placeTroop(engineState, currentPlayer, pendingFirstPlacement.troopId, pendingFirstPlacement.targetNodeId, { kind: "skip" });
        pendingFirstPlacement = null;
        speculativeState = null;
        isAdditionalPlacementStep = false;
        selectedTroopId = null;
        inspectedNodeId = null;
        effectMode = "apply";
        applyEngineResult(result, "Placement failed.");
        return;
      }
      if (selectedTroopId) {
        effectMode = "skip";
        notice = "Effet regle sur passer pour la prochaine pose.";
        emit();
        return;
      }
    }

    if (!canUseHumanControls()) return;
    if (!isTutorialIntentAllowed(intent)) {
      setTutorialFeedback(tutorialActionFeedback(intent));
      emit();
      return;
    }

    if (isTutorialActive()) {
      dispatchTutorialIntent(intent);
      return;
    }

    if (intent.type === UI_ACTION_TYPES.SELECT_TROOP) {
      selectedTroopId = intent.payload.troopId;
      inspectedNodeId = null;
      effectMode = "apply";
      phase = isAdditionalPlacementStep ? UI_PHASES.SELECTING_ADDITIONAL : UI_PHASES.SELECTING;
      promptText = isAdditionalPlacementStep
        ? "Pose supplementaire: inspectez un emplacement pour la troupe selectionnee."
        : "Inspectez un emplacement: la previsualisation explique le coup avant le clic.";
      emit();
      return;
    }

    if (intent.type === UI_ACTION_TYPES.DRAW) {
      const currentPlayer = engineState.turn.currentPlayer;
      applyEngineResult(drawTroops(engineState, currentPlayer), "Draw failed.");
      return;
    }

    if (intent.type === UI_ACTION_TYPES.PLACE_TROOP && selectedTroopId) {
      const currentPlayer = engineState.turn.currentPlayer;
      if (isAdditionalPlacementStep) {
        phase = UI_PHASES.RESOLVING_EFFECT;
        emit();
        const secondEffectChoice = effectMode === "apply"
          ? buildAutomaticChoice(speculativeState, currentPlayer, selectedTroopId, intent.payload.targetNodeId)
          : { kind: "skip" };
        const choice = {
          kind: "placeAdditionalTroop",
          troopId: selectedTroopId,
          targetNodeId: intent.payload.targetNodeId,
          effect: secondEffectChoice
        };
        const result = placeTroop(engineState, currentPlayer, pendingFirstPlacement.troopId, pendingFirstPlacement.targetNodeId, choice);
        pendingFirstPlacement = null;
        speculativeState = null;
        isAdditionalPlacementStep = false;
        selectedTroopId = null;
        inspectedNodeId = null;
        effectMode = "apply";
        applyEngineResult(result, "Placement failed.");
        return;
      }

      if (troopType(selectedTroopId) === "captaine" && effectMode === "apply") {
        const tempState = JSON.parse(JSON.stringify(engineState));
        const placeRes = placeTroop(tempState, currentPlayer, selectedTroopId, intent.payload.targetNodeId, { kind: "skip" });
        if (placeRes.ok) {
          if (placeRes.state.winner) {
            phase = UI_PHASES.RESOLVING_EFFECT;
            emit();
            selectedTroopId = null;
            inspectedNodeId = null;
            effectMode = "apply";
            applyEngineResult(placeRes, "Placement failed.");
            return;
          }
          pendingFirstPlacement = { troopId: selectedTroopId, targetNodeId: intent.payload.targetNodeId };
          speculativeState = placeRes.state;
          isAdditionalPlacementStep = true;
          phase = UI_PHASES.SELECTING_ADDITIONAL;
          selectedTroopId = null;
          inspectedNodeId = null;
          promptText = "Soldat place. Selectionnez la troupe supplementaire a poser.";
          emit();
          return;
        } else {
          phase = UI_PHASES.RESOLVING_EFFECT;
          emit();
          selectedTroopId = null;
          inspectedNodeId = null;
          effectMode = "apply";
          applyEngineResult(placeRes, "Placement failed.");
          return;
        }
      }

      phase = UI_PHASES.RESOLVING_EFFECT;
      emit();
      const result = placeTroop(engineState, currentPlayer, selectedTroopId, intent.payload.targetNodeId, buildEffectChoice(intent.payload.targetNodeId));
      selectedTroopId = null;
      inspectedNodeId = null;
      effectMode = "apply";
      applyEngineResult(result, "Placement failed.");
    }
  }

  function getSnapshot() {
    const viewer = gameMode === "vs-human" ? engineState.turn.currentPlayer : HUMAN_PLAYER;
    let viewState = engineState;
    if (speculativeState) {
      viewState = JSON.parse(JSON.stringify(speculativeState));
      viewState.turn.currentPlayer = engineState.turn.currentPlayer;
      viewState.turn.turnNumber = engineState.turn.turnNumber;
    }
    const view = createPublicGameView(viewState, viewer);
    const uiState = currentPhaseState();
    const tutorialStep = currentTutorialStep(tutorial);
    const canDraw = uiState.canDraw && uiState.canInteract && tutorialCanDraw();
    return {
      engineState,
      view,
      uiState,
      phase,
      promptText,
      notice,
      selectedTroopId,
      inspectedNodeId,
      effectMode,
      tutorial,
      tutorialStep,
      tutorialProgress: tutorialProgressLabel(tutorial),
      controls: {
        canDraw,
        canReset: true,
        canStartTutorial: gameMode === "vs-computer" && !isTutorialActive(),
      },
      pendingFirstPlacement,
      isAdditionalPlacementStep,
    };
  }

  return {
    dispatch,
    getSnapshot,
    isLegalPlacement,
    tutorialCanSelectTroop,
    tutorialCanPlaceNode,
    isTutorialHighlightedSupport,
    isTutorialHighlightedNode,
  };
}
