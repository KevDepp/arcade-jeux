import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getOfficialTerrain } from "../engine/index.js";
import { UI_ACTION_TYPES } from "./action-protocol.js";
import { createUiScriptHarness } from "./script-harness.js";

const TOTAL_TROOPS_PER_PLAYER = 24;

function firstEnabledSupport(observation, predicate = () => true) {
  return observation.state.players.blue.support.find((slot) => slot.enabled && predicate(slot));
}

function firstLegalNode(observation, predicate = () => true) {
  return observation.state.legalHighlights.find(predicate);
}

function hiddenOpponentSupportIsConcealed(observation) {
  return observation.state.players.red.support.every((slot) => slot.hidden && slot.troopId === null && slot.type === null);
}

function zoneTotalsAreCoherent(observation) {
  return Object.values(observation.state.counters.zoneTotals).every((total) => total === TOTAL_TROOPS_PER_PLAYER);
}

function selectFirstPlaceableTroop(harness, afterDraw) {
  for (const support of afterDraw.state.players.blue.support.filter((slot) => slot.enabled)) {
    const selected = harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: support.troopId }, `select ${support.testid}`);
    if (selected.state.legalHighlights.length > 0) return { support, selected };
  }
  return { support: null, selected: null };
}

function finishScenario(id, harness) {
  return {
    id,
    status: harness.errors.length === 0 ? "passed" : "failed",
    actions: harness.actions,
    observations: harness.observations,
    assertions: harness.assertions,
    errors: harness.errors,
  };
}

function runNormalPublicStateRegression() {
  const harness = createUiScriptHarness({ resetSeed: "ui-regression-normal" });
  const initial = harness.observe("initial");
  harness.assertStep("initial opponent support identities are concealed", hiddenOpponentSupportIsConcealed(initial), initial.state.players.red.support);
  harness.assertStep("initial zone counters total 24 troops per player", zoneTotalsAreCoherent(initial), initial.state.counters.zoneTotals);

  const afterReset = harness.dispatch(UI_ACTION_TYPES.RESET_GAME, {}, "reset");
  harness.assertStep("reset leaves draw available to the human player", afterReset.state.controls.canDraw, afterReset.state.controls);
  harness.assertStep("reset zone counters remain coherent", zoneTotalsAreCoherent(afterReset), afterReset.state.counters.zoneTotals);

  const afterDraw = harness.dispatch(UI_ACTION_TYPES.DRAW, {}, "draw");
  harness.assertStep("draw keeps public zone counters coherent", zoneTotalsAreCoherent(afterDraw), afterDraw.state.counters.zoneTotals);
  harness.assertStep("opponent support remains concealed after draw and AI response", hiddenOpponentSupportIsConcealed(afterDraw), afterDraw.state.players.red.support);

  const { selected } = selectFirstPlaceableTroop(harness, afterDraw);
  harness.assertStep("human can select at least one troop with legal board highlights", Boolean(selected), selected?.state.legalHighlights ?? []);
  const legalNode = selected ? firstLegalNode(selected) : null;
  harness.assertStep("selected troop exposes a legal board target", Boolean(legalNode), selected?.state.legalHighlights ?? []);

  if (legalNode) {
    const afterPlacement = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: legalNode.nodeId }, `place ${legalNode.testid}`);
    harness.assertStep("placement clears selected troop", afterPlacement.state.selectedTroopId === null, afterPlacement.state.selectedTroopId);
    harness.assertStep("AI response event is visible after human placement", afterPlacement.state.recentEvents.some((event) => event.player === "red"), afterPlacement.state.recentEvents);
    harness.assertStep("post-placement counters remain coherent", zoneTotalsAreCoherent(afterPlacement), afterPlacement.state.counters.zoneTotals);
    harness.assertStep("opponent support identities remain concealed after AI turn", hiddenOpponentSupportIsConcealed(afterPlacement), afterPlacement.state.players.red.support);
  }

  return finishScenario("normal_public_state_regression", harness);
}

function runTutorialGuardrailRegression() {
  const harness = createUiScriptHarness({ resetSeed: "ui-regression-tutorial-guardrails" });
  harness.observe("initial");
  const started = harness.dispatch(UI_ACTION_TYPES.START_TUTORIAL, {}, "start tutorial");
  harness.assertStep("tutorial starts on intro step", started.state.tutorial.stepId === "intro", started.state.tutorial);

  const blockedDraw = harness.dispatch(UI_ACTION_TYPES.DRAW, {}, "blocked draw on intro");
  harness.assertStep("out-of-step draw stays on intro", blockedDraw.state.tutorial.stepId === "intro", blockedDraw.state.tutorial);
  harness.assertStep("out-of-step draw produces visible feedback", blockedDraw.state.notice.length > 0 && blockedDraw.state.tutorial.feedback.length > 0, {
    notice: blockedDraw.state.notice,
    feedback: blockedDraw.state.tutorial.feedback,
  });

  const drawStep = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to draw");
  const blockedSelection = harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: drawStep.state.players.blue.support[0]?.troopId }, "blocked selection on draw step");
  harness.assertStep("out-of-step selection stays on draw", blockedSelection.state.tutorial.stepId === "draw", blockedSelection.state.tutorial);
  harness.assertStep("out-of-step selection explains guided action", /Draw/.test(blockedSelection.state.notice), blockedSelection.state.notice);

  const afterDraw = harness.dispatch(UI_ACTION_TYPES.DRAW, {}, "tutorial draw");
  const openingTroop = firstEnabledSupport(afterDraw, (slot) => slot.tutorialHighlight);
  if (openingTroop) {
    harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: openingTroop.troopId }, "select opening troop");
    const afterOpening = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: "b1" }, "place opening troop");
    harness.assertStep("tutorial reaches invalid placement lesson", afterOpening.state.tutorial.stepId === "invalidPlacement", afterOpening.state.tutorial);
    const blockedCoverSelection = harness.dispatch(
      UI_ACTION_TYPES.SELECT_TROOP,
      { troopId: afterOpening.state.players.blue.support.find((slot) => slot.type === "star")?.troopId },
      "blocked cover selection before try button",
    );
    harness.assertStep("cover selection is blocked until invalid placement lesson is handled", blockedCoverSelection.state.tutorial.stepId === "invalidPlacement", blockedCoverSelection.state.tutorial);
    harness.assertStep("invalid-placement guardrail gives visible feedback", /Try button/.test(blockedCoverSelection.state.notice), blockedCoverSelection.state.notice);
    const explained = harness.dispatch(UI_ACTION_TYPES.EXPLAIN_INVALID_PLACEMENT, {}, "explain invalid placement");
    harness.assertStep("try button explains broken connection", /connection is broken/.test(explained.state.notice), explained.state.notice);
  } else {
    harness.assertStep("opening troop is available for guardrail path", false, afterDraw.state.players.blue.support);
  }

  return finishScenario("tutorial_guardrail_regression", harness);
}

function runTutorialMedalProgressionRegression() {
  const harness = createUiScriptHarness({ resetSeed: "ui-regression-tutorial-medal" });
  harness.observe("initial");
  harness.dispatch(UI_ACTION_TYPES.START_TUTORIAL, {}, "start tutorial");
  harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to draw");
  const afterDraw = harness.dispatch(UI_ACTION_TYPES.DRAW, {}, "tutorial draw");
  const openingTroop = firstEnabledSupport(afterDraw, (slot) => slot.tutorialHighlight);
  harness.assertStep("opening troop is highlighted", Boolean(openingTroop), afterDraw.state.players.blue.support);
  if (openingTroop) {
    harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: openingTroop.troopId }, "select opening troop");
    harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: "b1" }, "place opening troop");
    harness.dispatch(UI_ACTION_TYPES.EXPLAIN_INVALID_PLACEMENT, {}, "explain invalid placement");
    const coverStep = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to cover selection");
    harness.assertStep("tutorial advances to cover selection", coverStep.state.tutorial.stepId === "selectCover", coverStep.state.tutorial);
    const coverTroop = firstEnabledSupport(coverStep, (slot) => slot.tutorialHighlight);
    harness.assertStep("cover troop is highlighted and enabled", Boolean(coverTroop), coverStep.state.players.blue.support);
    if (coverTroop) {
      const afterCoverSelect = harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: coverTroop.troopId }, "select cover troop");
      harness.assertStep("cover placement highlights b2", afterCoverSelect.state.legalHighlights.some((node) => node.nodeId === "b2"), afterCoverSelect.state.legalHighlights);
      const afterCover = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: "b2" }, "cover red troop");
      harness.assertStep("tutorial reaches medal and effect lesson", afterCover.state.tutorial.stepId === "medalAndEffect", afterCover.state.tutorial);
      harness.assertStep("blue gained one medal after covering the region", afterCover.state.players.blue.medals.length === 1, afterCover.state.players.blue.medals);
      harness.assertStep(
        "cover event and region control are visible in recent events",
        afterCover.state.recentEvents.some((event) => event.kind === "coverTroop") &&
          afterCover.state.recentEvents.some((event) => event.kind === "regionControlled"),
        afterCover.state.recentEvents,
      );
      harness.assertStep(
        "b2 top troop is public blue Star after cover",
        afterCover.state.board.nodes.find((node) => node.nodeId === "b2")?.topTroop?.owner === "blue" &&
          afterCover.state.board.nodes.find((node) => node.nodeId === "b2")?.topTroop?.type === "star",
        afterCover.state.board.nodes.find((node) => node.nodeId === "b2"),
      );
      const completed = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to victory lesson");
      harness.assertStep("tutorial reaches final victory lesson", completed.state.tutorial.stepId === "complete", completed.state.tutorial);
    }
  }

  return finishScenario("tutorial_medal_progression_regression", harness);
}

function runCemeteryPublicTurnRegression() {
  const harness = createUiScriptHarness({
    terrain: getOfficialTerrain("le-cimetiere-maudit"),
    seed: "ui-regression-cemetery-public",
    resetSeed: "ui-regression-cemetery-public-reset",
  });
  const initial = harness.observe("cemetery initial");
  harness.assertStep("cemetery transcribed terrain is active", initial.state.terrain.id === "le-cimetiere-maudit" && initial.state.terrain.transcriptionStatus === "transcribed", initial.state.terrain);
  harness.assertStep("cemetery spatial graph counts are exposed", initial.state.terrain.nodeCount === 17 && initial.state.terrain.edgeCount === 30 && initial.state.terrain.medalSpaceCount === 14, initial.state.terrain);
  harness.assertStep("initial opponent support remains concealed on cemetery", hiddenOpponentSupportIsConcealed(initial), initial.state.players.red.support);

  const afterDraw = harness.dispatch(UI_ACTION_TYPES.DRAW, {}, "cemetery draw with AI reply");
  harness.assertStep("cemetery draw produced an AI response", afterDraw.state.recentEvents.some((event) => event.player === "red"), afterDraw.state.recentEvents);
  harness.assertStep("cemetery counters stay coherent after AI reply", zoneTotalsAreCoherent(afterDraw), afterDraw.state.counters.zoneTotals);

  const { selected } = selectFirstPlaceableTroop(harness, afterDraw);
  harness.assertStep("cemetery support selection exposes legal dense-board placement", Boolean(selected), selected?.state.legalHighlights ?? []);
  if (selected) {
    harness.assertStep("decision guidance names the selected placement choice", selected.state.decision?.headline?.includes("Pose de"), selected.state.decision);
    harness.assertStep("decision guidance exposes possible cemetery placements", selected.state.placementOptions?.some((option) => option.legal), selected.state.placementOptions);
    harness.assertStep(
      "decision guidance explains own HQ as illegal",
      selected.state.placementOptions?.some((option) => option.nodeId === "qg_blue" && option.code === "ownHqForbidden"),
      selected.state.placementOptions?.find((option) => option.nodeId === "qg_blue"),
    );
    const inspectedOwnHq = harness.dispatch(UI_ACTION_TYPES.INSPECT_NODE, { nodeId: "qg_blue" }, "inspect own HQ decision guidance");
    harness.assertStep("inspected placement reason is surfaced", inspectedOwnHq.state.inspectedPlacement?.code === "ownHqForbidden", inspectedOwnHq.state.inspectedPlacement);
  }
  const legalNode = selected ? firstLegalNode(selected) : null;
  harness.assertStep("cemetery legal placement target exists", Boolean(legalNode), selected?.state.legalHighlights ?? []);

  if (legalNode) {
    const afterPlacement = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: legalNode.nodeId }, `cemetery place ${legalNode.testid}`);
    harness.assertStep("cemetery placement appears in recent events", afterPlacement.state.recentEvents.some((event) => event.kind === "placeTroop" && event.player === "blue"), afterPlacement.state.recentEvents);
    harness.assertStep("cemetery AI replies after human placement", afterPlacement.state.recentEvents.some((event) => event.player === "red"), afterPlacement.state.recentEvents);
    harness.assertStep("cemetery opponent support identities remain concealed after turn", hiddenOpponentSupportIsConcealed(afterPlacement), afterPlacement.state.players.red.support);
  }

  return finishScenario("cemetery_public_turn_regression", harness);
}

function runCemeteryTutorialRegionEffectRegression() {
  const harness = createUiScriptHarness({
    terrain: getOfficialTerrain("le-cimetiere-maudit"),
    seed: "ui-regression-cemetery-tutorial",
  });
  const started = harness.dispatch(UI_ACTION_TYPES.START_TUTORIAL, {}, "start cemetery tutorial");
  harness.assertStep("cemetery tutorial starts on cemetery terrain", started.state.terrain.id === "le-cimetiere-maudit" && started.state.tutorial.title === "Lire la carte", {
    terrain: started.state.terrain,
    tutorial: started.state.tutorial,
  });

  harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "cemetery advance to draw");
  const afterDraw = harness.dispatch(UI_ACTION_TYPES.DRAW, {}, "cemetery tutorial draw");
  harness.assertStep("cemetery tutorial explains the AI draw reply", afterDraw.state.tutorial.stepId === "aiDrawReply", afterDraw.state.tutorial);
  harness.assertStep("cemetery tutorial route includes only large slab playable positions", afterDraw.state.board.occupiedNodes.some((node) => node.nodeId === "p_bottom_center_square" && node.topTroop?.owner === "blue"), afterDraw.state.board.occupiedNodes);
  harness.assertStep("cemetery tutorial prepares a discard for the special-base lesson", afterDraw.state.players.blue.discardCount === 1, afterDraw.state.players.blue);

  const selectOpeningStep = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to cemetery opening selection");
  const openingTroop = firstEnabledSupport(selectOpeningStep, (slot) => slot.tutorialHighlight);
  harness.assertStep("cemetery opening troop is highlighted", Boolean(openingTroop), selectOpeningStep.state.players.blue.support);
  if (openingTroop) {
    const afterOpeningSelect = harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: openingTroop.troopId }, "select cemetery opening troop");
    harness.assertStep("cemetery opening placement highlights the top-center slab", afterOpeningSelect.state.legalHighlights.some((node) => node.nodeId === "p_top_center_square"), afterOpeningSelect.state.legalHighlights);
    const afterOpening = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: "p_top_center_square" }, "place cemetery opening troop");
    harness.assertStep("cemetery tutorial explains the AI placement reply", afterOpening.state.tutorial.stepId === "aiPlaceReply", afterOpening.state.tutorial);
    harness.assertStep("cemetery red setup occupies the bottom-right slab", afterOpening.state.board.occupiedNodes.some((node) => node.nodeId === "p_bottom_right_square" && node.topTroop?.owner === "red" && node.topTroop?.type === "crochet"), afterOpening.state.board.occupiedNodes);

    const invalidStep = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to cemetery invalid placement");
    const explained = harness.dispatch(UI_ACTION_TYPES.EXPLAIN_INVALID_PLACEMENT, {}, "explain cemetery blocked central placement");
    harness.assertStep("cemetery invalid placement explains exact QG connection rule", /Q\.G\..*propres (bases|cases)|propres (bases|cases).*Q\.G\./.test(explained.state.notice), {
      invalidStep: invalidStep.state.tutorial,
      notice: explained.state.notice,
    });
    const coverStep = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to cemetery cover selection");
    const coverTroop = firstEnabledSupport(coverStep, (slot) => slot.tutorialHighlight);
    harness.assertStep("cemetery cover troop is highlighted", Boolean(coverTroop), coverStep.state.players.blue.support);

    if (coverTroop) {
      const afterCoverSelect = harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: coverTroop.troopId }, "select cemetery cover troop");
      harness.assertStep("cemetery cover placement highlights the bottom-right slab", afterCoverSelect.state.legalHighlights.some((node) => node.nodeId === "p_bottom_right_square"), afterCoverSelect.state.legalHighlights);
      const afterCover = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: "p_bottom_right_square" }, "cover cemetery red troop");
      harness.assertStep("cemetery tutorial reaches route/effect lesson", afterCover.state.tutorial.title === "Route et effet", afterCover.state.tutorial);
      harness.assertStep("cemetery spatial model keeps medals unclaimed in this tutorial state", afterCover.state.players.blue.medals.length === 0 && afterCover.state.board.regions.length === 10, {
        medals: afterCover.state.players.blue.medals,
        regions: afterCover.state.board.regions,
      });
      const kwakLesson = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to Kwak lesson");
      harness.assertStep("cemetery tutorial teaches Kwak joker and weakness", /joker/.test(kwakLesson.state.tutorial.text) && /recouvrir Kwak/.test(kwakLesson.state.tutorial.text), kwakLesson.state.tutorial);
      const specialSelectStep = harness.dispatch(UI_ACTION_TYPES.ADVANCE_TUTORIAL, {}, "advance to special-base troop selection");
      const specialTroop = firstEnabledSupport(specialSelectStep, (slot) => slot.tutorialHighlight);
      harness.assertStep("cemetery special-base troop is highlighted", Boolean(specialTroop), specialSelectStep.state.players.blue.support);
      if (specialTroop) {
        const specialPlacementStep = harness.dispatch(UI_ACTION_TYPES.SELECT_TROOP, { troopId: specialTroop.troopId }, "select cemetery special-base troop");
        harness.assertStep("cemetery special-base placement highlights the southeast pumpkin", specialPlacementStep.state.legalHighlights.some((node) => node.nodeId === "sp_se_pumpkin"), specialPlacementStep.state.legalHighlights);
        const beforeDiscardCount = specialPlacementStep.state.players.blue.discardCount;
        const afterSpecial = harness.dispatch(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: "sp_se_pumpkin" }, "trigger cemetery special base");
        harness.assertStep("cemetery special base recovers a discard to support", afterSpecial.state.players.blue.discardCount === beforeDiscardCount - 1, {
          beforeDiscardCount,
          afterDiscardCount: afterSpecial.state.players.blue.discardCount,
          events: afterSpecial.state.recentEvents,
        });
        harness.assertStep("cemetery tutorial reaches QG threat lesson", afterSpecial.state.tutorial.stepId === "qgThreat", afterSpecial.state.tutorial);
      }
    }
  }

  return finishScenario("cemetery_tutorial_region_effect_regression", harness);
}

export function runUiRegressionScenarios(options = {}) {
  const requested = options.scenario ?? "all";
  const scenarioMap = {
    normal: runNormalPublicStateRegression,
    guardrails: runTutorialGuardrailRegression,
    medal: runTutorialMedalProgressionRegression,
  };
  const scenarios = requested === "all"
    ? Object.values(scenarioMap).map((run) => run())
    : requested === "cemetery"
      ? [runCemeteryPublicTurnRegression(), runCemeteryTutorialRegionEffectRegression()]
      : [scenarioMap[requested]?.()];
  if (scenarios.some((scenario) => !scenario)) throw new Error(`Unknown UI regression scenario: ${requested}`);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    command: "ui:regressions",
    requestedScenario: requested,
    scenarioCount: scenarios.length,
    failedCount: scenarios.filter((scenario) => scenario.status !== "passed").length,
    status: scenarios.every((scenario) => scenario.status === "passed") ? "passed" : "failed",
    scenarios,
  };
}

export async function writeUiRegressionReport(report, reportPath = "data/tasks/T-018_ui_scripted_regressions/ui_regressions_report.json") {
  const fullPath = resolve(reportPath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return fullPath;
}
