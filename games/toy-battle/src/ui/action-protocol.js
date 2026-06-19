import { TROOP_CATALOG, explainPlacement, listLegalActions } from "../engine/index.js";

export const UI_PHASES = Object.freeze({
  IDLE: "idle",
  SELECTING: "selecting",
  SELECTING_ADDITIONAL: "selectingAdditional",
  RESOLVING_EFFECT: "resolvingEffect",
  ANIMATING: "animating",
  AI_THINKING: "aiThinking",
  GAME_OVER: "gameOver",
});

export const UI_ACTION_TYPES = Object.freeze({
  START_GAME: "startGame",
  RESET_GAME: "resetGame",
  SELECT_TROOP: "selectTroop",
  DRAW: "draw",
  PLACE_TROOP: "placeTroop",
  SKIP_EFFECT: "skipEffect",
  APPLY_EFFECT: "applyEffect",
  CHOOSE_EFFECT_TARGET: "chooseEffectTarget",
  CHOOSE_ADDITIONAL_PLACEMENT: "chooseAdditionalPlacement",
  RUN_AI_TURN: "runAiTurn",
  INSPECT_NODE: "inspectNode",
  CLEAR_INSPECTION: "clearInspection",
  START_TUTORIAL: "startTutorial",
  ADVANCE_TUTORIAL: "advanceTutorial",
  EXIT_TUTORIAL: "exitTutorial",
  EXPLAIN_INVALID_PLACEMENT: "explainInvalidPlacement",
});

export function createUiIntent(type, payload = {}) {
  if (!Object.values(UI_ACTION_TYPES).includes(type)) {
    throw new Error(`Unknown UI action type: ${type}`);
  }
  return { type, payload };
}

function troopSummary(state, troopId, { hidden = false } = {}) {
  if (hidden) return { hidden: true, label: "Hidden troop" };
  const troop = state.troops[troopId];
  const definition = TROOP_CATALOG[troop.type];
  return {
    hidden: false,
    troopId,
    owner: troop.owner,
    type: troop.type,
    displayName: definition.displayName,
    force: definition.force,
    effectKind: definition.effect.kind,
  };
}

function topTroopId(state, baseId) {
  return state.board.stacks[baseId]?.troopIds.at(-1) ?? null;
}

function publicSupportSlot(state, viewer, player, slot, index) {
  const isViewer = viewer === player;
  const publicIdentity = isViewer || slot.hiddenFromOpponent === false || state.troops[slot.troopId]?.location?.visibility === "public";
  return {
    slotId: `${player}-support-${index}`,
    player,
    index,
    availability: slot.availability,
    unavailableReason: slot.unavailableReason ?? null,
    ...troopSummary(state, slot.troopId, { hidden: !publicIdentity }),
  };
}

export function createPublicGameView(state, viewer = "blue") {
  const players = Object.fromEntries(
    Object.entries(state.players).map(([player, data]) => [
      player,
      {
        id: player,
        isViewer: player === viewer,
        supportCount: data.support.length,
        support: data.support.map((slot, index) => publicSupportSlot(state, viewer, player, slot, index)),
        reserveCount: data.reserve.length,
        discardCount: data.discard.length,
        discard: data.discard.map((troopId) => troopSummary(state, troopId)),
        removedFromGameCount: data.removedFromGame.length,
        medals: [...data.medals],
        objectiveMedals: data.objectiveMedals,
      },
    ]),
  );

  const nodes = state.terrain.nodes.map((node) => {
    const stack = state.board.stacks[node.id]?.troopIds ?? [];
    const topId = topTroopId(state, node.id);
    return {
      id: node.id,
      kind: node.kind,
      owner: node.owner ?? null,
      label: node.label,
      x: node.x ?? null,
      y: node.y ?? null,
      shape: node.shape ?? null,
      zone: node.zone ?? null,
      uncertainty: node.uncertainty ?? null,
      stackCount: stack.length,
      stack: stack.map((troopId) => troopSummary(state, troopId)),
      topTroop: topId ? troopSummary(state, topId) : null,
      specialBaseEffect: node.specialBaseEffect ?? null,
      placementRestriction: node.placementRestriction ?? null,
    };
  });

  return {
    schemaVersion: state.schemaVersion,
    terrain: {
      id: state.terrain.id,
      displayName: state.terrain.displayName,
      nodes,
      edges: state.terrain.edges.map((edge) => ({ ...edge })),
      medalSpaces: (state.terrain.medalSpaces ?? []).map((medal) => ({ ...medal })),
      spatialModel: state.terrain.spatialModel ? { ...state.terrain.spatialModel } : null,
      transcriptionStatus: state.terrain.transcriptionStatus,
      unresolvedDataNotes: [...(state.terrain.unresolvedDataNotes ?? [])],
      coordinateSystem: state.terrain.coordinateSystem ? { ...state.terrain.coordinateSystem } : null,
      regions: state.terrain.regions.map((region) => ({
        ...region,
        controller: state.board.controlledRegions[region.id] ?? null,
        medals: region.medalSpaceIds.map((medalId) => state.board.unclaimedMedals[medalId]),
      })),
    },
    players,
    turn: { ...state.turn },
    winner: state.winner ?? null,
    eventLog: state.eventLog.map((event) => ({ ...event })),
  };
}

function topTroopSummary(state, nodeId) {
  const troopId = topTroopId(state, nodeId);
  return troopId ? troopSummary(state, troopId) : null;
}

function placementReasonText(legality) {
  if (legality.ok) return "Coup autorise.";
  const messages = {
    gameOver: "La partie est terminee.",
    notCurrentPlayer: "Ce n'est pas votre tour.",
    troopNotInSupport: "Cette troupe n'est pas dans votre support.",
    troopTemporarilyUnavailable: "Cette troupe est indisponible pour ce tour.",
    unknownTarget: "Cet emplacement n'existe pas.",
    ownHqForbidden: "Interdit: vous ne pouvez jamais poser sur votre propre Q.G.",
    targetNotConnected: "Interdit: il faut une chaine continue depuis votre Q.G. en passant seulement par vos bases occupees.",
    terrainRestrictionDenied: "Interdit: ce terrain refuse cette valeur de troupe sur cet emplacement.",
    enemyForceTooHigh: "Interdit: la troupe adverse visible n'est pas de force inferieure.",
  };
  return messages[legality.code] ?? legality.message ?? "Coup interdit.";
}

function placementPreviewText(state, selectedTroopId, node, legality) {
  const selected = troopSummary(state, selectedTroopId);
  const topTroop = topTroopSummary(state, node.id);
  if (!legality.ok) return placementReasonText(legality);
  if (legality.targetKind === "enemyHq") return `Victoire immediate: ${selected.displayName} atteint le Q.G. adverse.`;
  if (legality.targetKind === "emptyBase") {
    return legality.connection === "ignoredByCrochetForBase"
      ? `${selected.displayName} peut se poser ici: Crochet ignore la connexion pour une base.`
      : `${selected.displayName} se pose sur une base vide connectee a votre Q.G.`;
  }
  if (legality.targetKind === "ownOccupiedBase") return `${selected.displayName} renforce votre pile sur ${node.label}.`;
  if (legality.targetKind === "kwakJokerCover") return `${selected.displayName} couvre ${topTroop?.displayName ?? "la troupe adverse"} grace a la regle Kwak.`;
  if (legality.targetKind === "enemyWeakerBase") return `${selected.displayName} couvre ${topTroop?.displayName ?? "la troupe adverse"} de force inferieure.`;
  return placementReasonText(legality);
}

function drawStatusFor(state, viewer, legalActions) {
  const drawAction = legalActions.find((action) => action.kind === "draw");
  if (state.winner) return { canDraw: false, code: "gameOver", message: "La partie est terminee.", drawCount: 0 };
  if (state.turn.currentPlayer !== viewer) return { canDraw: false, code: "notCurrentPlayer", message: "Attendez le tour adverse.", drawCount: 0 };
  if (drawAction) return { canDraw: true, code: null, message: `Possible: piocher ${drawAction.drawCount} troupe${drawAction.drawCount > 1 ? "s" : ""}.`, drawCount: drawAction.drawCount };
  if (state.players[viewer].support.length >= 8) return { canDraw: false, code: "supportFull", message: "Impossible: votre support contient deja 8 troupes.", drawCount: 0 };
  if (state.players[viewer].reserve.length === 0) return { canDraw: false, code: "reserveEmpty", message: "Impossible: votre reserve est vide.", drawCount: 0 };
  return { canDraw: false, code: "unknown", message: "Pioche indisponible.", drawCount: 0 };
}

function effectGuidanceFor(state, selectedTroopId) {
  if (!selectedTroopId) return "Selectionnez une troupe pour voir son effet avant de poser.";
  const selected = troopSummary(state, selectedTroopId);
  const effect = TROOP_CATALOG[selected.type]?.effect;
  if (!effect || effect.kind === "none" || selected.type === "crochet") return `${selected.displayName}: aucun effet facultatif a choisir.`;
  if (effect.kind === "drawFromReserve") return `${selected.displayName}: vous pourrez appliquer la pioche d'effet ou la passer.`;
  if (effect.kind === "discardRandomOpponentSupport") return `${selected.displayName}: vous pourrez defausser une troupe aleatoire du support adverse ou passer.`;
  if (effect.kind === "discardAdjacentEnemy") return `${selected.displayName}: choisissez une troupe adverse adjacente visible, ou passez.`;
  if (effect.kind === "placeAdditionalTroop") return `${selected.displayName}: choisissez une pose supplementaire, ou passez.`;
  return `${selected.displayName}: effet facultatif disponible.`;
}

function createPlacementOptions(state, viewer, selectedTroopId) {
  if (!selectedTroopId) return [];
  return state.terrain.nodes.map((node) => {
    const legality = explainPlacement(state, viewer, selectedTroopId, node.id);
    return {
      nodeId: node.id,
      legal: legality.ok,
      code: legality.ok ? null : legality.code,
      message: legality.message ?? null,
      humanMessage: placementReasonText(legality),
      targetKind: legality.targetKind ?? null,
      connection: legality.connection ?? null,
      preview: placementPreviewText(state, selectedTroopId, node, legality),
      topTroop: topTroopSummary(state, node.id),
    };
  });
}

function createDecisionSummary(state, viewer, selectedTroopId, drawStatus, placementOptions, phase = null) {
  if (state.winner) {
    return {
      headline: `Partie terminee: ${state.winner.winner} gagne.`,
      recommendation: "Relancez une partie pour rejouer.",
      placementStatus: "Aucune pose possible: la partie est terminee.",
    };
  }
  if (state.turn.currentPlayer !== viewer) {
    return {
      headline: "Tour adverse: observez ce qui change.",
      recommendation: "Attendez la fin du tour adverse.",
      placementStatus: "Vous ne pouvez pas poser pendant le tour adverse.",
    };
  }
  if (phase === UI_PHASES.SELECTING_ADDITIONAL) {
    if (!selectedTroopId) {
      return {
        headline: "Pose supplementaire du Soldat: choisissez une autre troupe.",
        recommendation: "Selectionnez une troupe de votre support a poser en plus, ou cliquez sur Passer.",
        placementStatus: "Cliquez sur une troupe pour voir ou la poser.",
      };
    } else {
      const legalCount = placementOptions.filter((option) => option.legal).length;
      const selected = troopSummary(state, selectedTroopId);
      return {
        headline: `Pose supplementaire: placez ${selected.displayName}.`,
        recommendation: legalCount > 0 ? `${legalCount} emplacement${legalCount > 1 ? "s" : ""} autorise${legalCount > 1 ? "s" : ""}.` : "Aucun emplacement autorise pour cette troupe: choisissez une autre troupe ou passez.",
        placementStatus: "Les emplacements verts sont jouables; cliquez pour valider la double pose.",
      };
    }
  }
  if (!selectedTroopId) {
    return {
      headline: "A vous de choisir: piocher ou poser.",
      recommendation: drawStatus.canDraw ? "Recommande si vous voulez plus d'options: piocher. Sinon selectionnez une troupe." : "Selectionnez une troupe disponible: la pioche est indisponible.",
      placementStatus: "Selectionnez une troupe du support pour afficher les emplacements et les raisons d'interdiction.",
    };
  }
  const legalCount = placementOptions.filter((option) => option.legal).length;
  const selected = troopSummary(state, selectedTroopId);
  return {
    headline: `Pose de ${selected.displayName}: inspectez un emplacement avant de cliquer.`,
    recommendation: legalCount > 0 ? `${legalCount} emplacement${legalCount > 1 ? "s" : ""} autorise${legalCount > 1 ? "s" : ""}.` : "Aucun emplacement autorise pour cette troupe: choisissez une autre troupe ou piochez.",
    placementStatus: legalCount > 0 ? "Les emplacements verts sont jouables; les autres expliquent pourquoi ils sont interdits au survol ou au focus." : "Cette troupe ne peut pas etre posee maintenant.",
  };
}

export function createUiPhaseState({ state, viewer = "blue", phase = UI_PHASES.IDLE, selectedTroopId = null, inspectedNodeId = null, prompt = "" }) {
  const isViewerTurn = state.turn.currentPlayer === viewer;
  const legalActions = isViewerTurn && !state.winner ? listLegalActions(state, viewer) : [];
  const legalPlacements = selectedTroopId
    ? legalActions.filter((action) => action.kind === "placeTroop" && action.troopId === selectedTroopId)
    : [];
  const placementOptions = createPlacementOptions(state, viewer, selectedTroopId);
  const placementOptionsByNodeId = Object.fromEntries(placementOptions.map((option) => [option.nodeId, option]));
  const drawStatus = phase === UI_PHASES.SELECTING_ADDITIONAL
    ? { canDraw: false, code: "selectingAdditional", message: "Pioche indisponible pendant la pose supplementaire.", drawCount: 0 }
    : drawStatusFor(state, viewer, legalActions);
  const inspectedPlacement = inspectedNodeId ? placementOptionsByNodeId[inspectedNodeId] ?? null : null;
  const effectGuidance = phase === UI_PHASES.SELECTING_ADDITIONAL
    ? (selectedTroopId
        ? "Pose supplementaire: placez la troupe ou cliquez sur Passer."
        : "Soldat: selectionnez une troupe supplementaire a poser, ou cliquez sur Passer.")
    : effectGuidanceFor(state, selectedTroopId);

  return {
    phase: state.winner ? UI_PHASES.GAME_OVER : phase,
    viewer,
    selectedTroopId,
    inspectedNodeId,
    prompt,
    canDraw: drawStatus.canDraw,
    drawStatus,
    canInteract: isViewerTurn && !state.winner && [UI_PHASES.IDLE, UI_PHASES.SELECTING, UI_PHASES.SELECTING_ADDITIONAL].includes(phase),
    legalActions,
    legalPlacementNodeIds: legalPlacements.map((action) => action.targetNodeId),
    placementOptions,
    placementOptionsByNodeId,
    inspectedPlacement,
    effectGuidance,
    decisionSummary: createDecisionSummary(state, viewer, selectedTroopId, drawStatus, placementOptions, phase),
  };
}
