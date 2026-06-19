import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { createUiIntent, UI_ACTION_TYPES } from "./action-protocol.js";
import { HUMAN_PLAYER, createToyBattleUiController } from "./app-controller.js";

function immediateSchedule(callback) {
  callback();
  return 0;
}

function eventText(event) {
  if (event.kind === "gameSetup") return `Mise en place sur ${event.terrainId}.`;
  if (event.kind === "draw") return `${event.player} pioche ${event.count}.`;
  if (event.kind === "placeTroop") return `${event.player} pose ${event.troopId} sur ${event.targetNodeId}.`;
  if (event.kind === "coverTroop") return `${event.coveringTroopId} recouvre ${event.coveredTroopId}.`;
  if (event.kind === "regionControlled") return `${event.player} controle ${event.regionId} et gagne ${event.claimedMedalIds.join(", ")}.`;
  if (event.kind === "effectSkipped") return `Effet passe: ${event.reason}.`;
  if (event.kind === "win") return `${event.winner} gagne: ${event.reason}.`;
  return event.kind;
}

function nodeSummary(node, controller, legalNodeIds) {
  return {
    testid: `board-node-${node.id}`,
    nodeId: node.id,
    label: node.label,
    kind: node.kind,
    stackCount: node.stackCount,
    stack: node.stack,
    topTroop: node.topTroop,
    legalHighlight: legalNodeIds.has(node.id) && controller.tutorialCanPlaceNode(node.id),
    tutorialHighlight: controller.isTutorialHighlightedNode(node.id),
  };
}

function supportSummary(slot, controller) {
  return {
    testid: `support-slot-${slot.player}-${slot.index}`,
    slotId: slot.slotId,
    player: slot.player,
    index: slot.index,
    troopId: slot.troopId ?? null,
    type: slot.type ?? null,
    displayName: slot.displayName ?? slot.label,
    force: slot.force ?? null,
    hidden: Boolean(slot.hidden),
    availability: slot.availability,
    enabled: slot.player === HUMAN_PLAYER && !slot.hidden && slot.availability === "available" && controller.tutorialCanSelectTroop(slot.troopId),
    tutorialHighlight: slot.troopId ? controller.isTutorialHighlightedSupport(slot.troopId) : false,
  };
}

export function summarizeUiSnapshot(snapshot, controller) {
  const { view, uiState, tutorial, tutorialStep } = snapshot;
  const legalNodeIds = new Set(uiState.legalPlacementNodeIds);
  const boardStackCounts = Object.fromEntries(
    Object.keys(view.players).map((playerId) => [
      playerId,
      view.terrain.nodes
        .flatMap((node) => node.stack)
        .filter((troop) => troop.owner === playerId).length,
    ]),
  );
  const zoneTotals = Object.fromEntries(
    Object.entries(view.players).map(([playerId, player]) => [
      playerId,
      player.reserveCount + player.supportCount + player.discardCount + player.removedFromGameCount + (boardStackCounts[playerId] ?? 0),
    ]),
  );
  const selectedTroop = snapshot.selectedTroopId
    ? Object.values(view.players).flatMap((player) => player.support).find((slot) => slot.troopId === snapshot.selectedTroopId) ??
      view.terrain.nodes.flatMap((node) => node.stack).find((troop) => troop.troopId === snapshot.selectedTroopId) ??
      null
    : null;

  return {
    terrain: {
      id: view.terrain.id,
      displayName: view.terrain.displayName,
      transcriptionStatus: view.terrain.transcriptionStatus,
      nodeCount: view.terrain.nodes.length,
      edgeCount: view.terrain.edges.length,
      medalSpaceCount: view.terrain.medalSpaces.length,
      regionCount: view.terrain.regions.length,
    },
    turn: view.turn,
    phase: uiState.phase,
    prompt: uiState.prompt,
    decision: uiState.decisionSummary,
    drawStatus: uiState.drawStatus,
    effectGuidance: uiState.effectGuidance,
    inspectedPlacement: uiState.inspectedPlacement,
    notice: snapshot.notice,
    controls: snapshot.controls,
    selectedTroopId: snapshot.selectedTroopId,
    selectedTroop,
    tutorial: tutorial?.active
      ? {
          active: true,
          stepIndex: tutorial.stepIndex,
          progress: snapshot.tutorialProgress,
          title: tutorialStep.title,
          stepId: tutorialStep.id,
          text: tutorialStep.text,
          feedback: tutorial.feedback,
          completed: tutorial.completed,
        }
      : { active: false },
    players: Object.fromEntries(
      Object.entries(view.players).map(([playerId, player]) => [
        playerId,
        {
          reserveCount: player.reserveCount,
          supportCount: player.supportCount,
          discardCount: player.discardCount,
          removedFromGameCount: player.removedFromGameCount,
          medals: player.medals,
          objectiveMedals: player.objectiveMedals,
          support: player.support.map((slot) => supportSummary(slot, controller)),
        },
      ]),
    ),
    scores: Object.fromEntries(
      Object.entries(view.players).map(([playerId, player]) => [playerId, `${player.medals.length}/${player.objectiveMedals}`]),
    ),
    counters: {
      boardStackCounts,
      zoneTotals,
    },
    legalActions: uiState.legalActions.map((action) => ({ ...action })),
    placementOptions: uiState.placementOptions.map((option) => ({ ...option })),
    legalHighlights: view.terrain.nodes
      .filter((node) => legalNodeIds.has(node.id) && controller.tutorialCanPlaceNode(node.id))
      .map((node) => ({ testid: `board-node-${node.id}`, nodeId: node.id, label: node.label })),
    board: {
      nodes: view.terrain.nodes.map((node) => nodeSummary(node, controller, legalNodeIds)),
      occupiedNodes: view.terrain.nodes.filter((node) => node.stackCount > 0).map((node) => nodeSummary(node, controller, legalNodeIds)),
      regions: view.terrain.regions.map((region) => ({
        id: region.id,
        controller: region.controller,
        medals: region.medals,
      })),
    },
    recentEvents: view.eventLog.slice(-8).map((event) => ({ ...event, text: eventText(event) })),
  };
}

export function createUiScriptHarness(options = {}) {
  const observations = [];
  const actions = [];
  const assertions = [];
  const errors = [];
  const controller = createToyBattleUiController({
    schedule: immediateSchedule,
    aiDelayMs: 0,
    animationDelayMs: 0,
    resetSeed: () => options.resetSeed ?? "ui-script-normal",
    seed: options.seed ?? "ui-script-initial",
    terrain: options.terrain,
  });

  function observe(label) {
    const observation = {
      label,
      atActionIndex: actions.length,
      state: summarizeUiSnapshot(controller.getSnapshot(), controller),
    };
    observations.push(observation);
    return observation;
  }

  function dispatch(type, payload = {}, label = type) {
    const intent = createUiIntent(type, payload);
    try {
      controller.dispatch(intent);
      const observation = observe(label);
      actions.push({ label, intent, observationLabel: observation.label });
      return observation;
    } catch (error) {
      const record = { label, intent, error: String(error?.stack ?? error) };
      actions.push(record);
      errors.push(record);
      return observe(`${label}:error`);
    }
  }

  function assertStep(label, condition, observed = null) {
    const assertion = { label, passed: Boolean(condition), observed };
    assertions.push(assertion);
    if (!assertion.passed) errors.push({ label, observed, error: "assertion failed" });
    return assertion;
  }

  return { controller, actions, observations, assertions, errors, observe, dispatch, assertStep };
}

function firstEnabledSupport(observation, predicate = () => true) {
  return observation.state.players.blue.support.find((slot) => slot.enabled && predicate(slot));
}

function firstLegalNode(observation, predicate = () => true) {
  return observation.state.legalHighlights.find(predicate);
}

function runNormalScenario() {
  const harness = createUiScriptHarness({ resetSeed: "ui-script-normal" });
  harness.observe("initial");
  harness.dispatch(UI_ACTION_TYPES.RESET_GAME, {}, "reset");
  const afterDraw = harness.dispatch(UI_ACTION_TYPES.DRAW, {}, "draw");
  harness.assertStep(
    "draw action is visible in recent events",
    afterDraw.state.recentEvents.some((event) => event.kind === "draw" && event.player === "blue"),
    afterDraw.state.recentEvents,
  );

  let selected = null;
  let selectedObservation = null;
  for (const support of afterDraw.state.players.blue.support.filter((slot) => slot.enabled)) {
    const observation = harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: support.troopId }, `select ${support.testid}`);
    if (observation.state.legalHighlights.length > 0) {
      selected = support;
      selectedObservation = observation;
      break;
    }
  }

  harness.assertStep("a selectable support troop has legal highlights", Boolean(selected), selectedObservation?.state.legalHighlights ?? []);
  if (selectedObservation) {
    const node = firstLegalNode(selectedObservation);
    harness.assertStep("first legal node exists", Boolean(node), selectedObservation.state.legalHighlights);
    if (node) {
      const afterPlacement = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: node.nodeId }, `place ${node.testid}`);
      harness.assertStep(
        "human placement appears in recent events",
        afterPlacement.state.recentEvents.some((event) => event.kind === "placeTroop" && event.player === "blue"),
        afterPlacement.state.recentEvents,
      );
      harness.assertStep(
        "board has an occupied stack after placement",
        afterPlacement.state.board.occupiedNodes.length > 0,
        afterPlacement.state.board.occupiedNodes,
      );
      harness.assertStep(
        "AI response happened after human turn",
        afterPlacement.state.recentEvents.some((event) => event.player === "red"),
        afterPlacement.state.recentEvents,
      );
    }
  }

  return {
    id: "normal_first_draw_select_place",
    status: harness.errors.length === 0 ? "passed" : "failed",
    actions: harness.actions,
    observations: harness.observations,
    assertions: harness.assertions,
    errors: harness.errors,
  };
}

function runTutorialScenario() {
  const harness = createUiScriptHarness({ resetSeed: "ui-script-tutorial" });
  harness.observe("initial");
  const started = harness.dispatch(UI_ACTION_TYPES.START_TUTORIAL, {}, "start tutorial");
  harness.assertStep("tutorial starts at goal step", started.state.tutorial.title === "Goal", started.state.tutorial);

  const drawStep = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to draw");
  harness.assertStep("tutorial advances to draw step", drawStep.state.tutorial.title === "Draw", drawStep.state.tutorial);

  const afterDraw = harness.dispatch(UI_ACTION_TYPES.DRAW, {}, "tutorial draw");
  harness.assertStep("tutorial draw reaches select step", afterDraw.state.tutorial.stepId === "selectOpening", afterDraw.state.tutorial);

  const openingTroop = firstEnabledSupport(afterDraw, (slot) => slot.tutorialHighlight);
  harness.assertStep("opening troop is highlighted and enabled", Boolean(openingTroop), afterDraw.state.players.blue.support);
  if (openingTroop) {
    const afterSelect = harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: openingTroop.troopId }, "select tutorial opening troop");
    harness.assertStep("tutorial opening placement highlights b1", afterSelect.state.legalHighlights.some((node) => node.nodeId === "b1"), afterSelect.state.legalHighlights);
    const afterPlace = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: "b1" }, "place tutorial opening troop");
    harness.assertStep("tutorial reaches invalid placement lesson after first placement", afterPlace.state.tutorial.stepId === "invalidPlacement", afterPlace.state.tutorial);
    harness.assertStep("opening placement occupies b1", afterPlace.state.board.occupiedNodes.some((node) => node.nodeId === "b1"), afterPlace.state.board.occupiedNodes);
    harness.assertStep("scripted red setup occupies b2", afterPlace.state.board.occupiedNodes.some((node) => node.nodeId === "b2"), afterPlace.state.board.occupiedNodes);
  }

  return {
    id: "tutorial_start_draw_first_placement",
    status: harness.errors.length === 0 ? "passed" : "failed",
    actions: harness.actions,
    observations: harness.observations,
    assertions: harness.assertions,
    errors: harness.errors,
  };
}

export function runUiScriptScenarios(options = {}) {
  const requested = options.scenario ?? "all";
  const scenarios = [];
  if (requested === "all" || requested === "normal") scenarios.push(runNormalScenario());
  if (requested === "all" || requested === "tutorial") scenarios.push(runTutorialScenario());
  if (scenarios.length === 0) throw new Error(`Unknown UI script scenario: ${requested}`);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    command: "ui:script",
    requestedScenario: requested,
    status: scenarios.every((scenario) => scenario.status === "passed") ? "passed" : "failed",
    scenarios,
  };
}

export async function writeUiScriptReport(report, reportPath = "data/tasks/T-017_ui_scriptable_harness/ui_script_report.json") {
  const fullPath = resolve(reportPath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return fullPath;
}
