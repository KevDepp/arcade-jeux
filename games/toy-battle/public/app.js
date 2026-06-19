import { getOfficialTerrain, syntheticMvpTerrain } from "../src/engine/index.js";
import { isDenseTerrainLayout, layoutForTerrain, routePointsForEdge, registerCustomTerrainLayout } from "../src/ui/board-layout.js";
import { createUiIntent, UI_ACTION_TYPES, UI_PHASES } from "../src/ui/action-protocol.js";
import { HUMAN_PLAYER, AI_PLAYER, createToyBattleUiController } from "../src/ui/app-controller.js";
import { TUTORIAL_STEP_IDS } from "../src/ui/tutorial.js";

const app = document.querySelector("#app");
const CEMETERY_TERRAIN_ID = "le-cimetiere-maudit";
const terrainOptions = [getOfficialTerrain(CEMETERY_TERRAIN_ID), syntheticMvpTerrain];

// Load persisted custom terrains from localStorage
try {
  const saved = localStorage.getItem("toy-battle-custom-terrains");
  if (saved) {
    const savedCustomTerrains = JSON.parse(saved);
    savedCustomTerrains.forEach((terrain) => {
      registerCustomTerrainLayout(terrain);
      terrainOptions.push(terrain);
    });
  }
} catch (e) {
  console.error("Failed to load custom terrains from localStorage", e);
}

const requestedTerrainId = new URLSearchParams(window.location.search).get("terrain");
let selectedTerrainId = terrainOptions.some((terrain) => terrain.id === requestedTerrainId) ? requestedTerrainId : CEMETERY_TERRAIN_ID;
let selectedGameMode = "vs-computer";
let controller = createControllerForTerrain(selectedTerrainId, selectedGameMode);

let isEditorMode = false;
let editorState = {
  nodes: [],
  edges: [],
  medals: [],
  selectedTool: "base",
  draggedNodeId: null,
  edgeStartNodeId: null,
  isSymmetric: true,
};

const TROOP_TILE_META = Object.freeze({
  kwak: Object.freeze({
    mark: "KW",
    role: "Canard joker",
    effect: "Joker: couvre tout",
    theme: "duck",
  }),
  skully: Object.freeze({
    mark: "SK",
    role: "Squelette jouet",
    effect: "Effet: pioche 2",
    theme: "skull",
  }),
  captaine: Object.freeze({
    mark: "CP",
    role: "Capitaine",
    effect: "Effet: pose +1",
    theme: "captain",
  }),
  mastok: Object.freeze({
    mark: "MT",
    role: "Mastok",
    effect: "Effet: defausse adjacent",
    theme: "heavy",
  }),
  crochet: Object.freeze({
    mark: "HK",
    role: "Crochet",
    effect: "Pose base libre",
    theme: "hook",
  }),
  xb42: Object.freeze({
    mark: "42",
    role: "Robot",
    effect: "Effet: defausse support",
    theme: "robot",
  }),
  star: Object.freeze({
    mark: "ST",
    role: "Etoile",
    effect: "Effet: pioche 1",
    theme: "star",
  }),
  roxy: Object.freeze({
    mark: "RX",
    role: "Dino Roxy",
    effect: "Force pure",
    theme: "dino",
  }),
});

function terrainById(terrainId) {
  return terrainOptions.find((terrain) => terrain.id === terrainId) ?? terrainOptions[0];
}

function createControllerForTerrain(terrainId, gameMode = "vs-computer") {
  const terrain = terrainById(terrainId);
  const gameSeed = `ui-game-${terrain.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return createToyBattleUiController({
    onChange: render,
    terrain,
    seed: gameSeed,
    resetSeed: () => `ui-game-${terrain.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    mode: gameMode,
  });
}

function layoutPoint(layout, id) {
  return layout[id] ?? { x: 50, y: 50 };
}

function coordinatePoint(terrain, item) {
  const width = terrain.coordinateSystem?.width ?? 100;
  const height = terrain.coordinateSystem?.height ?? 100;
  return {
    x: Number.isFinite(item.x) ? Math.max(0, Math.min(100, (item.x / width) * 100)) : 50,
    y: Number.isFinite(item.y) ? Math.max(0, Math.min(100, (item.y / height) * 100)) : 50,
  };
}

function shortRegionName(regionId) {
  return regionId
    .replace(/^R_/, "")
    .replace(/_/g, " ")
    .toLowerCase();
}

function cemeteryRegionTitle(regionId) {
  const titles = {
    R_NW_PUMPKIN: "Zone NW",
    R_UPPER_LEFT_CENTER: "Haut centre",
    R_NE_PUMPKIN: "Zone NE",
    R_CENTER_UPPER_TRIANGLE: "Centre haut",
    R_CENTER_LEFT: "Centre O",
    R_CENTER_RIGHT: "Centre E",
    R_CENTER_LOWER: "Centre bas",
    R_LOWER_CENTER: "Bas centre",
    R_SW_PUMPKIN: "Zone SW",
    R_SE_PUMPKIN: "Zone SE",
  };
  return titles[regionId] ?? shortRegionName(regionId);
}

function cemeteryPadClass(node) {
  if (node.shape === "large-square") return "is-plaza";
  if (node.shape === "pumpkin") return "is-special";
  if (node.shape === "coffin" || node.shape === "sarcophagus") return "is-coffin";
  if (node.shape === "lantern") return "is-lantern";
  if (node.shape === "vault") return "is-vault";
  if (node.shape === "round") return "is-round";
  const label = node.label.toLowerCase();
  if (label.includes("large stone square") || label.includes("grande dalle")) return "is-plaza";
  if (label.includes("coffin") || label.includes("sarcophagus")) return "is-coffin";
  if (label.includes("lantern")) return "is-lantern";
  if (label.includes("vault")) return "is-vault";
  if (label.includes("round")) return "is-round";
  if (label.includes("tilted")) return "is-tilted";
  if (label.includes("double")) return "is-double";
  return "is-grave";
}

function cemeteryNodeShortLabel(id) {
  if (id === "qg_blue") return "QG B";
  if (id === "qg_red") return "QG R";
  if (id.startsWith("sp_")) return id.replace("sp_", "P ").replace("_pumpkin", "").toUpperCase();
  return id
    .replace(/^p_/, "")
    .split("_")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
}

const CEMETERY_VISUAL_REGION_HINTS = Object.freeze([
  { className: "north-west", x: 28, y: 31, w: 23, h: 18, r: -22 },
  { className: "north-east", x: 72, y: 31, w: 23, h: 18, r: 22 },
  { className: "middle-west", x: 34, y: 52, w: 25, h: 20, r: -12 },
  { className: "middle-east", x: 66, y: 52, w: 25, h: 20, r: 12 },
  { className: "south-west", x: 32, y: 72, w: 24, h: 17, r: 16 },
  { className: "south-east", x: 68, y: 72, w: 24, h: 17, r: -16 },
]);

const CEMETERY_VISUAL_MEDAL_HINTS = Object.freeze([
  [29, 30], [38, 34], [43, 43], [56, 43], [37, 55], [50, 52], [63, 55],
  [30, 68], [42, 69], [56, 69], [70, 68], [36, 82], [62, 82], [78, 78],
]);

const CEMETERY_VISUAL_GRAVE_HINTS = Object.freeze([
  [22, 17, -8], [30, 18, 8], [54, 16, -4], [64, 17, 6], [74, 18, -7],
  [23, 38, -12], [34, 39, 8], [47, 36, -2], [59, 37, 5], [77, 39, -10],
  [20, 50, 7], [29, 49, -7], [41, 58, 10], [58, 58, -8], [72, 49, 9], [82, 51, -12],
  [23, 64, -6], [34, 63, 11], [47, 75, -9], [58, 75, 7], [74, 64, -5],
  [28, 88, 8], [42, 88, -7], [55, 88, 6], [67, 88, -8],
]);

function renderCemeteryDecor(view, layout) {
  const pads = view.terrain.nodes.map((node) => {
    const point = layoutPoint(layout, node.id);
    const classes = [
      "cemetery-base-pad",
      cemeteryPadClass(node),
      node.kind === "hq" ? "is-hq" : "",
      node.kind === "specialBase" ? "is-special" : "",
      node.owner ? `owner-${node.owner}` : "",
    ].filter(Boolean).join(" ");
    return `<span class="${classes}" style="left:${point.x}%; top:${point.y}%;" data-testid="cemetery-base-pad-${node.id}"></span>`;
  }).join("");
  const regionHints = CEMETERY_VISUAL_REGION_HINTS.map((hint) => `
    <span
      class="cemetery-visual-region-hint ${hint.className}"
      style="left:${hint.x}%; top:${hint.y}%; width:${hint.w}%; height:${hint.h}%; --rot:${hint.r}deg;"
      aria-hidden="true"
    ></span>
  `).join("");
  const graveHints = CEMETERY_VISUAL_GRAVE_HINTS.map(([x, y, rotation], index) => `
    <span
      class="cemetery-visual-grave-hint ${index % 4 === 0 ? "is-coffin" : ""}"
      style="left:${x}%; top:${y}%; --rot:${rotation}deg;"
      aria-hidden="true"
    ></span>
  `).join("");
  return `
    <div class="cemetery-map-art" data-testid="cemetery-map-art" aria-hidden="true">
      <span class="cemetery-forest left" data-testid="cemetery-forest-left"></span>
      <span class="cemetery-forest right" data-testid="cemetery-forest-right"></span>
      <span class="cemetery-fence top" data-testid="cemetery-top-fence"></span>
      <span class="cemetery-fence bottom" data-testid="cemetery-bottom-fence"></span>
      <span class="cemetery-gate blue" data-testid="cemetery-blue-gate"></span>
      <span class="cemetery-gate red" data-testid="cemetery-red-gate"></span>
      <span class="cemetery-mausoleum" data-testid="cemetery-mausoleum"></span>
      <span class="cemetery-red-fort" data-testid="cemetery-red-fort"></span>
      <span class="cemetery-root root-nw" data-testid="cemetery-root-nw"></span>
      <span class="cemetery-root root-se" data-testid="cemetery-root-se"></span>

      ${regionHints}
      ${graveHints}
    </div>
    <div class="cemetery-base-pads" data-testid="cemetery-base-pads" aria-hidden="true">
      ${pads}
    </div>
  `;
}

function renderCemeteryLegend() {
  return `
    <div class="cemetery-board-legend" data-testid="cemetery-board-legend">
      <span><i class="legend-stone"></i>Base</span>
      <span><i class="legend-special"></i>Base speciale</span>
      <span><i class="legend-hq"></i>Q.G.</span>
      <span><i class="legend-medal"></i>Medaille</span>
      <span><i class="legend-legal"></i>Jouable</span>
    </div>
  `;
}

function renderCemeteryBoardDetail(view, uiState) {
  const inspected = uiState.inspectedPlacement ?? null;
  const fallback = uiState.selectedTroopId ? uiState.placementOptions.find((option) => option.legal) ?? null : null;
  const detail = inspected ?? fallback;
  const node = detail ? view.terrain.nodes.find((item) => item.id === detail.nodeId) : null;
  const headline = node
    ? `${node.kind === "hq" ? "Q.G." : node.kind === "specialBase" ? "Base speciale" : "Base"} ${node.id}`
    : "Detail de carte";
  const body = detail
    ? detail.preview
    : "Selectionnez une troupe puis survolez une base pour voir la legalite et le resultat.";
  const reason = detail
    ? detail.humanMessage
    : "Les chemins clairs relient les bases jouables depuis votre Q.G.";
  return `
    <div class="cemetery-board-detail ${detail?.legal ? "is-legal" : detail ? "is-blocked" : ""}" data-testid="cemetery-board-detail">
      <strong>${headline}</strong>
      <span>${node?.label ?? "Chemins, regions et bases speciales restent visibles sans zoom."}</span>
      <span data-testid="cemetery-board-detail-preview">${body}</span>
      <span data-testid="cemetery-board-detail-reason">${reason}</span>
    </div>
  `;
}

function compactTroopText(troop) {
  if (!troop) return "";
  return troopForceText(troop);
}

function shortUncertainty(note) {
  return note
    .replace("The physical reference image still has right-edge crop and left glare; strict visual comparison remains partial.", "Right edge cropped and left glare in source photo.")
    .replace("Partial transcription from private rework reference; keep transcriptionStatus=partial until physical/second-source review.", "Private rework transcription awaiting second-source review.")
    .replace("Partial transcription from private rework reference plus cemetery_spatial_analysis.md; keep transcriptionStatus=partial until physical/second-source review.", "Private rework/spatial analysis awaiting second-source review.")
    .replace("Right board edge is partially cropped in the private source photo; right-edge nodes and adjacencies remain candidate data.", "Right edge cropped in the source photo.")
    .replace("Glare/reflection on the left third affects upper-left and lower-left path/region confirmation.", "Left glare affects path and region confirmation.")
    .replace("Right board edge partially cropped in source photo; coordinates and right-edge paths remain candidate data.", "Right edge cropped in the source photo.")
    .replace("Left glare/reflection obscures several paths and medal spaces; kept as candidate graph until manual review.", "Left glare obscures paths and medal spaces.")
    .replace("Candidate regions/medals are playable but require board-owner review before marking reviewed.", "Regions and medals remain candidate data.");
}

function troopLabel(troop) {
  if (!troop || troop.hidden) return "Hidden";
  return `${troop.displayName} ${troop.force}`;
}

function troopForceText(troop) {
  if (!troop || troop.hidden) return "?";
  return troop.force === "joker" ? "J" : String(troop.force);
}

function troopTileMeta(troop) {
  return TROOP_TILE_META[troop?.type] ?? Object.freeze({
    mark: troop?.type?.slice(0, 2)?.toUpperCase() ?? "??",
    role: troop?.type ?? "Troupe",
    effect: "Effet inconnu",
    theme: "generic",
  });
}

function troopTileStateLabel(state) {
  const labels = {
    hidden: "Cachee",
    playable: "Jouable",
    blocked: "Non jouable",
    selected: "Selectionnee",
    board: "Sur plateau",
  };
  return labels[state] ?? state;
}

function renderTroopTile(troop, { variant = "support", state = "board", reason = "Sur le plateau.", selected = false } = {}) {
  if (!troop || troop.hidden) {
    return `
      <div
        class="troop-tile is-hidden variant-${variant}"
        data-testid="troop-tile-hidden"
        data-troop-tile="${variant}"
        data-tile-state="hidden"
        data-tile-reason="Cachee"
      >
        <div class="troop-art is-hidden" aria-hidden="true" data-mark="??"></div>
        <div class="troop-info">
          <strong>Cachee</strong>
          <span class="troop-role">Identite masquee</span>
          <span class="troop-effect">Visible apres defausse ou plateau</span>
        </div>
        <span class="troop-state">Cachee</span>
      </div>
    `;
  }
  const meta = troopTileMeta(troop);
  const stateLabel = troopTileStateLabel(state);
  const reasonMarkup = state === "blocked" ? `<span class="troop-reason" data-testid="troop-tile-reason-${troop.troopId ?? troop.type}">Raison: ${reason}</span>` : "";
  return `
    <div
      class="troop-tile owner-${troop.owner} type-${troop.type} theme-${meta.theme} variant-${variant} state-${state} ${selected ? "is-selected" : ""}"
      data-testid="troop-tile-${troop.troopId ?? troop.type}"
      data-troop-tile="${variant}"
      data-troop-id="${troop.troopId ?? ""}"
      data-troop-type="${troop.type}"
      data-owner="${troop.owner}"
      data-force="${troop.force}"
      data-effect-kind="${troop.effectKind ?? "none"}"
      data-tile-state="${state}"
      data-tile-reason="${reason}"
    >
      <div class="troop-art theme-${meta.theme}" aria-hidden="true" data-mark="${meta.mark}">
        <span class="troop-force">${troopForceText(troop)}</span>
      </div>
      <div class="troop-info">
        <strong>${troop.displayName}</strong>
        <span class="troop-role">${meta.role}</span>
        <span class="troop-effect">${meta.effect}</span>
      </div>
      <span class="troop-state" title="${reason}">${stateLabel}</span>
      ${reasonMarkup}
    </div>
  `;
}

function renderCompactTroop(troop, nodeId) {
  if (!troop) return "";
  const meta = troopTileMeta(troop);
  return `
    <span
      class="compact-troop owner-${troop.owner} type-${troop.type} theme-${meta.theme}"
      data-testid="compact-troop-${nodeId}"
      data-troop-type="${troop.type}"
      data-owner="${troop.owner}"
      data-force="${troop.force}"
      data-effect-kind="${troop.effectKind ?? "none"}"
      title="${troop.displayName} - force ${troop.force} - ${meta.effect}"
    >
      <span class="compact-force">${troopForceText(troop)}</span>
      <span class="compact-mark">${meta.mark}</span>
    </span>
  `;
}

function eventText(event) {
  if (event.kind === "gameSetup") return `Mise en place sur ${event.terrainId}.`;
  if (event.kind === "draw") return `${event.player} pioche ${event.count} troupe${event.count > 1 ? "s" : ""}.`;
  if (event.kind === "placeTroop") return `${event.player} pose ${event.troopId} sur ${event.targetNodeId}.`;
  if (event.kind === "coverTroop") return `${event.coveringTroopId} recouvre ${event.coveredTroopId}.`;
  if (event.kind === "regionControlled") return `${event.player} controle ${event.regionId} et gagne ${event.claimedMedalIds.join(", ")}.`;
  if (event.kind === "returnTroopToSupport") return `${event.troopId} revient dans le support.`;
  if (event.kind === "discardTroop") return `${event.troopId} part a la defausse.`;
  if (event.kind === "moveTroop") return `${event.troopId} se deplace vers ${event.toBaseId}.`;
  if (event.kind === "specialBaseEffect") return `Base speciale ${event.baseId}: ${event.effect}.`;
  if (event.kind === "effectSkipped") return `Effet passe: ${event.reason}.`;
  if (event.kind === "win") return `${event.winner} gagne: ${event.reason}.`;
  if (event.kind === "troopTemporarilyUnavailable") return `${event.troopId} est indisponible temporairement.`;
  if (event.kind === "troopAvailable") return `${event.troopId} redevient disponible.`;
  return event.kind;
}

function renderTroopChip(troop, extraClass = "") {
  const color = troop?.owner ?? "";
  const hidden = troop?.hidden ? "hidden" : "";
  return `
    <div class="troop-chip ${color} ${hidden} ${extraClass}" data-testid="troop-chip">
      ${renderTroopTile(troop, { variant: "chip", state: troop?.hidden ? "hidden" : "board", reason: "Sur le plateau." })}
    </div>
  `;
}

function renderBoard(view, uiState, snapshot = {}) {
  const layout = layoutForTerrain(view.terrain.id);
  const isDense = isDenseTerrainLayout(view.terrain.id);
  const edgeLines = view.terrain.edges.map((edge) => {
    const points = routePointsForEdge(view.terrain, layout, edge).map((point) => `${point.x},${point.y}`).join(" ");
    return `
      <g class="path-segment" data-testid="path-${edge.id}">
        <polyline class="path-line path-underlay" points="${points}" />
        <polyline class="path-line path-stones" points="${points}" />
      </g>
    `;
  }).join("");
  const regionShapes = isDense ? view.terrain.regions.map((region) => {
    const points = region.boundaryBaseIds.map((id) => layoutPoint(layout, id)).map((point) => `${point.x},${point.y}`).join(" ");
    return `<polygon class="region-shape" points="${points}" data-testid="region-shape-${region.id}" />`;
  }).join("") : "";
  const regions = view.terrain.regions.map((region) => {
    const points = region.boundaryBaseIds.map((id) => layoutPoint(layout, id));
    const center = points.reduce((acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }), { x: 0, y: 0 });
    const medalText = region.medals.map((medal) => medal.status === "claimed" ? `${medal.id}:${medal.claimedBy}` : medal.id).join(" ");
    return `
      <div class="region-label ${isDense ? "is-dense" : ""}" style="left:${center.x}%; top:${center.y}%;" data-testid="region-${region.id}">
        <strong>${isDense ? cemeteryRegionTitle(region.id) : region.id}</strong>
        <span>${region.controller ?? "open"} - ${medalText}</span>
      </div>
    `;
  }).join("");
  const medals = isDense ? view.terrain.medalSpaces.map((medal) => {
    const point = coordinatePoint(view.terrain, medal);
    const status = regionMedalStatus(view, medal.id);
    return `
      <div
        class="medal-marker ${status.claimedBy ? `claimed-${status.claimedBy}` : ""}"
        style="left:${point.x}%; top:${point.y}%;"
        data-testid="medal-${medal.id}"
        title="${medal.id}${status.claimedBy ? ` claimed by ${status.claimedBy}` : ""}"
      >${medal.initialValue ?? 1}</div>
    `;
  }).join("") : "";
  const nodes = view.terrain.nodes.map((node) => {
    const point = layoutPoint(layout, node.id);
    const isLegal = uiState.legalPlacementNodeIds.includes(node.id) && controller.tutorialCanPlaceNode(node.id);
    const placement = uiState.placementOptionsByNodeId?.[node.id] ?? null;
    const inspected = uiState.inspectedNodeId === node.id;
    const reasonText = placement?.humanMessage ?? (uiState.selectedTroopId ? "Selectionnez ou inspectez un emplacement." : "Selectionnez une troupe pour connaitre la legalite.");
    const previewText = placement?.preview ?? reasonText;
    const tutorialHighlight = controller.isTutorialHighlightedNode(node.id);
    const ownerClass = node.owner ? `owner-${node.owner}` : "";
    const isPendingFirstNode = snapshot.pendingFirstPlacement?.targetNodeId === node.id;
    if (isDense) {
      const occupiedClass = node.topTroop ? `occupied-${node.topTroop.owner}` : "";
      const stackText = node.stackCount > 1 ? `+${node.stackCount}` : "";
      const popoverMedalText = node.specialBaseEffect ? "Special: discard to support" : node.placementRestriction ? "Restricted" : "Base";
      const padClass = cemeteryPadClass(node);
      return `
        <button
          class="node is-compact ${padClass} ${node.kind === "hq" ? "is-hq" : ""} ${node.kind === "specialBase" ? "is-special" : ""} ${ownerClass} ${occupiedClass} ${isLegal ? "is-legal" : ""} ${tutorialHighlight ? "tutorial-highlight" : ""} ${isPendingFirstNode ? "is-pending-placement" : ""}"
          style="--node-x:${point.x}%; --node-y:${point.y}%;"
          data-testid="board-node-${node.id}"
          data-node-id="${node.id}"
          data-placement-legal="${placement ? String(placement.legal) : ""}"
          data-placement-reason-code="${placement?.code ?? ""}"
          data-node-kind="${node.kind}"
          data-tutorial-highlight="${tutorialHighlight ? "true" : "false"}"
          title="${node.id} - ${node.label}. ${previewText}${node.uncertainty ? ` (${node.uncertainty})` : ""}"
          ${isLegal ? "" : 'aria-disabled="true"'}
        >
          <span class="compact-node-label">${cemeteryNodeShortLabel(node.id)}</span>
          ${node.topTroop ? renderCompactTroop(node.topTroop, node.id) : ""}
          ${stackText ? `<span class="compact-stack">${stackText}</span>` : ""}
          ${inspected ? `<span class="node-inspected" data-testid="node-inspected-${node.id}">?</span>` : ""}
          <span class="node-popover" aria-hidden="true">
            <strong>${node.id}</strong>
            <span>${node.label}</span>
            <span>${node.topTroop ? `${troopLabel(node.topTroop)} on top` : popoverMedalText}</span>
            <span data-testid="placement-reason-${node.id}">${reasonText}</span>
            <span data-testid="placement-preview-${node.id}">${previewText}</span>
            ${node.uncertainty ? `<span>${node.uncertainty}</span>` : ""}
          </span>
        </button>
      `;
    }
    return `
      <button
        class="node ${node.kind === "hq" ? "is-hq" : ""} ${ownerClass} ${isLegal ? "is-legal" : ""} ${tutorialHighlight ? "tutorial-highlight" : ""} ${isPendingFirstNode ? "is-pending-placement" : ""}"
        style="--node-x:${point.x}%; --node-y:${point.y}%;"
        data-testid="board-node-${node.id}"
        data-node-id="${node.id}"
        data-placement-legal="${placement ? String(placement.legal) : ""}"
        data-placement-reason-code="${placement?.code ?? ""}"
        data-tutorial-highlight="${tutorialHighlight ? "true" : "false"}"
        title="${previewText}"
        ${isLegal ? "" : "disabled"}
      >
        <span class="node-title"><span>${node.label}</span><span class="node-kind">${node.kind}</span></span>
        ${node.topTroop ? renderTroopChip(node.topTroop) : `<div class="troop-chip" data-testid="empty-node-${node.id}"><strong>Open</strong><span>Connected only</span></div>`}
        <span class="stack-count" data-testid="stack-count-${node.id}">stack ${node.stackCount}</span>
        <span class="node-popover" aria-hidden="true">
          <span data-testid="placement-reason-${node.id}">${reasonText}</span>
          <span data-testid="placement-preview-${node.id}">${previewText}</span>
        </span>
      </button>
    `;
  }).join("");

  return `
    <section class="table-area ${isDense ? "is-dense-board" : ""}" aria-label="Toy Battle board">
      <div class="board ${isDense ? "is-dense" : ""}" data-testid="board" data-terrain-id="${view.terrain.id}">
        ${isDense ? `
          ${renderCemeteryDecor(view, layout)}
          <div class="uncertainty-band left" data-testid="cemetery-left-glare"></div>
          <div class="uncertainty-band right" data-testid="cemetery-right-crop"></div>
          <div class="dense-board-status" data-testid="dense-board-status">
            <strong>${view.terrain.displayName}</strong>
            <span>${view.terrain.transcriptionStatus} map</span>
            <span>${view.terrain.nodes.length} nodes / ${view.terrain.edges.length} paths / ${view.terrain.medalSpaces.length} medals</span>
          </div>
        ` : ""}
        <svg class="board-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${regionShapes}${edgeLines}</svg>
        ${regions}
        ${medals}
        ${nodes}
        ${isDense ? `${renderCemeteryLegend()}${renderCemeteryBoardDetail(view, uiState)}` : ""}
      </div>
    </section>
  `;
}

function regionMedalStatus(view, medalId) {
  for (const region of view.terrain.regions) {
    const medal = region.medals.find((item) => item.id === medalId);
    if (medal) return medal;
  }
  return { id: medalId, status: "unclaimed" };
}

function renderSupport(playerView, uiState) {
  let sectionTitle = playerView.id === HUMAN_PLAYER ? "Your support" : "Opponent support";
  if (selectedGameMode === "vs-human") {
    const isCurrent = playerView.id === controller.getSnapshot().view.turn.currentPlayer;
    const playerLabel = playerView.id === "blue" ? "Joueur Bleu" : "Joueur Rouge";
    sectionTitle = isCurrent ? `Votre support (${playerLabel})` : `Support adverse (${playerLabel})`;
  }
  return `
    <section data-testid="${playerView.id}-support">
      <h2 class="section-title">${sectionTitle}</h2>
      <div class="hand-grid">
        ${playerView.support.map((slot) => {
          const selected = slot.troopId && slot.troopId === uiState.selectedTroopId;
          const tutorialHighlight = slot.troopId && controller.isTutorialHighlightedSupport(slot.troopId);
          const tutorialAllowsSelection = slot.troopId ? controller.tutorialCanSelectTroop(slot.troopId) : false;
          const canSelect =
            playerView.isViewer &&
            slot.troopId &&
            slot.availability === "available" &&
            uiState.canInteract &&
            tutorialAllowsSelection;
          const tileState = slot.hidden
            ? "hidden"
            : selected
              ? "selected"
              : canSelect
                ? "playable"
                : "blocked";
          const blockedReason = slot.hidden
            ? "Cachee"
            : !playerView.isViewer
              ? "Support adverse masque."
              : slot.availability !== "available"
                ? (slot.unavailableReason ?? "Cette troupe est indisponible pour ce tour.")
                : !uiState.canInteract
                  ? "Action indisponible pendant cette phase."
                  : !tutorialAllowsSelection
                    ? "Bloquee par le tutoriel."
                    : "Jouable maintenant.";
          return `
            <button
              class="support-card state-${tileState} ${selected ? "is-selected" : ""} ${tutorialHighlight ? "tutorial-highlight" : ""}"
              data-testid="support-slot-${slot.player}-${slot.index}"
              data-troop-id="${slot.troopId ?? ""}"
              data-troop-tile="support"
              data-tile-state="${tileState}"
              data-tile-reason="${blockedReason}"
              data-force="${slot.force ?? ""}"
              data-effect-kind="${slot.effectKind ?? ""}"
              data-troop-type="${slot.type ?? ""}"
              data-tutorial-highlight="${tutorialHighlight ? "true" : "false"}"
              ${canSelect ? "" : "disabled"}
            >
              ${renderTroopTile(slot, { variant: "support", state: tileState, reason: blockedReason, selected })}
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderCounters(view) {
  return `
    <div class="counter-grid">
      ${Object.values(view.players).map((player) => `
        <div class="counter" data-testid="player-counters-${player.id}">
          <strong>${player.id}</strong>
          <span data-testid="reserve-count-${player.id}">Reserve ${player.reserveCount}</span><br>
          <span data-testid="discard-count-${player.id}">Discard ${player.discardCount}</span><br>
          <span data-testid="removed-count-${player.id}">Removed ${player.removedFromGameCount}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderLog(view) {
  const events = view.eventLog.slice(-10).reverse();
  return `
    <section class="action-log" data-testid="event-log">
      <h2 class="section-title">Journal</h2>
      <ol>${events.map((event) => `<li data-testid="log-entry">${eventText(event)}</li>`).join("")}</ol>
    </section>
  `;
}

function renderDecisionPanel(snapshot) {
  const { uiState, view, notice } = snapshot;
  const summary = uiState.decisionSummary;
  const inspected = uiState.inspectedPlacement;
  const selected = snapshot.selectedTroopId
    ? view.players[HUMAN_PLAYER].support.find((slot) => slot.troopId === snapshot.selectedTroopId)
    : null;
  const effectChoiceAvailable = Boolean(selected) && !/aucun effet/.test(uiState.effectGuidance);
  const preview = inspected
    ? inspected.preview
    : selected
      ? "Survolez ou cliquez un emplacement pour previsualiser le resultat."
      : "Choisissez une action: piocher maintenant ou selectionner une troupe du support.";
  const reason = inspected
    ? inspected.humanMessage
    : selected
      ? "Aucun emplacement inspecte."
      : uiState.drawStatus.message;
  return `
    <section class="decision-panel" data-testid="decision-panel">
      <div class="decision-meta">
        <strong data-testid="current-player">Joueur actif: ${view.turn.currentPlayer}</strong>
        <span data-testid="ui-phase">Phase: ${uiState.phase}</span>
      </div>
      <h2 data-testid="decision-headline">${summary.headline}</h2>
      <p data-testid="decision-recommendation">${summary.recommendation}</p>
      <div class="decision-options">
        <div class="decision-option ${uiState.drawStatus.canDraw ? "is-available" : "is-blocked"}" data-testid="draw-guidance">
          <strong>Piocher</strong>
          <span>${uiState.drawStatus.message}</span>
        </div>
        <div class="decision-option ${selected ? "is-available" : "is-waiting"}" data-testid="placement-guidance">
          <strong>Poser</strong>
          <span>${summary.placementStatus}</span>
        </div>
      </div>
      ${selected ? `
        <div class="decision-selected" data-testid="selected-troop-summary">
          <strong>${selected.displayName} ${selected.force}</strong>
          <span>${selected.type}</span>
        </div>
      ` : ""}
      <div class="placement-preview-panel ${inspected?.legal ? "is-legal" : inspected ? "is-blocked" : ""}" data-testid="placement-preview-panel">
        <strong data-testid="placement-preview">${preview}</strong>
        <span data-testid="placement-reason">${reason}</span>
        ${inspected ? `<span data-testid="inspected-node">Emplacement inspecte: ${inspected.nodeId}</span>` : ""}
      </div>
      <div class="effect-choice-panel" data-testid="effect-choice-panel">
        <strong>Effet facultatif</strong>
        <span data-testid="effect-guidance">${uiState.effectGuidance}</span>
        <span data-testid="effect-mode">Mode: ${snapshot.effectMode === "apply" ? "appliquer" : "passer"}</span>
        <div class="effect-actions">
          <button class="command-button" data-testid="apply-effect-button" ${effectChoiceAvailable ? "" : "disabled"}>Appliquer</button>
          <button class="command-button" data-testid="skip-effect-button" ${(selected || snapshot.isAdditionalPlacementStep) ? "" : "disabled"}>Passer</button>
        </div>
      </div>
      <span data-testid="prompt">${uiState.prompt}</span>
      ${notice ? `<span data-testid="notice">${notice}</span>` : ""}
    </section>
  `;
}

function renderTerrainControls(view) {
  const notes = view.terrain.unresolvedDataNotes ?? [];
  return `
    <div class="terrain-controls" data-testid="terrain-control">
      <label for="terrain-select">Terrain</label>
      <div style="display: flex; gap: 8px; align-items: center;">
        <select id="terrain-select" data-testid="terrain-select" aria-label="Terrain" style="flex: 1;">
          ${terrainOptions.map((terrain) => {
            const isSynthetic = terrain.id === "synthetic-mvp-terrain";
            return `
              <option value="${terrain.id}" ${terrain.id === view.terrain.id ? "selected" : ""} ${isSynthetic ? "hidden style=\"display: none;\"" : ""}>${terrain.displayName}</option>
            `;
          }).join("")}
        </select>
        <button class="command-button" data-testid="editor-open-button" id="editor-open-button" style="padding: 6px 12px; font-size: 0.85rem; height: 36px; white-space: nowrap; margin-bottom: 8px;">Créer Terrain</button>
      </div>
      <label for="mode-select">Mode</label>
      <select id="mode-select" data-testid="mode-select" aria-label="Mode de jeu">
        <option value="vs-computer" ${selectedGameMode === "vs-computer" ? "selected" : ""}>Contre l'ordinateur</option>
        <option value="vs-human" ${selectedGameMode === "vs-human" ? "selected" : ""}>2 Joueurs (Local)</option>
      </select>
      <div class="terrain-status-card" data-testid="terrain-status">
        <span class="terrain-status-badge" data-testid="terrain-status-badge">${view.terrain.transcriptionStatus}</span>
        <strong>${view.terrain.transcriptionStatus === "partial" ? "Playable partial transcription" : "Playable test fixture"}</strong>
        ${notes.length > 0 ? `
          <ul data-testid="terrain-uncertainties">
            ${notes.slice(0, 3).map((note) => `<li>${shortUncertainty(note)}</li>`).join("")}
          </ul>
        ` : ""}
      </div>
    </div>
  `;
}

function renderTutorialPanel(snapshot) {
  if (!snapshot.tutorial?.active) return "";
  const step = snapshot.tutorialStep;
  const isIntro = step.id === TUTORIAL_STEP_IDS.INTRO;
  const isInvalid = step.id === TUTORIAL_STEP_IDS.INVALID_PLACEMENT;
  const isComplete = step.id === TUTORIAL_STEP_IDS.COMPLETE;
  const canUseNext = isIntro || step.action === "next" || isComplete || (isInvalid && snapshot.tutorial.feedback);
  return `
    <section class="tutorial-panel" data-testid="tutorial-panel">
      <div class="tutorial-heading">
        <span data-testid="tutorial-progress">${snapshot.tutorialProgress}</span>
        <strong data-testid="tutorial-title">${step.title}</strong>
      </div>
      <p data-testid="tutorial-step">${step.text}</p>
      ${isComplete ? `<p class="tutorial-complete" data-testid="tutorial-completion-state">Tutorial complete</p>` : ""}
      ${isInvalid ? `
        <button class="command-button" data-testid="tutorial-invalid-placement-button">
          Tester l'emplacement interdit
        </button>
      ` : ""}
      <p class="tutorial-feedback" data-testid="tutorial-feedback">${snapshot.tutorial.feedback}</p>
      <div class="tutorial-actions">
        <button class="command-button primary" data-testid="tutorial-next-button" ${canUseNext ? "" : "disabled"}>
          ${isComplete ? "Terminer" : "Suivant"}
        </button>
        <button class="command-button" data-testid="tutorial-exit-button">Quitter le tutoriel</button>
      </div>
    </section>
  `;
}

function isSameOrMirrorEdge(e1, e2) {
  const matchDirect = (e1.a === e2.a && e1.b === e2.b) || (e1.a === e2.b && e1.b === e2.a);
  if (matchDirect) return true;
  
  if (editorState.isSymmetric) {
    const mirrorId = (id) => id.endsWith("_mirror") ? id.replace("_mirror", "") : id + "_mirror";
    const ma = mirrorId(e1.a);
    const mb = mirrorId(e1.b);
    return (ma === e2.a && mb === e2.b) || (ma === e2.b && mb === e2.a);
  }
  return false;
}

function getMirroredState() {
  const cleanNodes = editorState.nodes.filter(n => !n.id.endsWith("_mirror") && n.y <= 80);
  const cleanEdges = editorState.edges.filter(e => {
    const aMirror = e.a.endsWith("_mirror");
    const bMirror = e.b.endsWith("_mirror");
    return !(aMirror && bMirror);
  });
  const cleanMedals = (editorState.medals || []).filter(m => !m.id.endsWith("_mirror") && m.y <= 80);

  const mirroredNodes = [];
  cleanNodes.forEach(n => {
    if (n.y === 80 && n.x === 50) return;
    const ownerMirror = n.owner === 'blue' ? 'red' : (n.owner === 'red' ? 'blue' : undefined);
    mirroredNodes.push({
      ...n,
      id: n.id + "_mirror",
      x: 100 - n.x,
      y: 160 - n.y,
      owner: ownerMirror
    });
  });
  
  const mirroredEdges = [];
  cleanEdges.forEach(e => {
    const aMirror = e.a.endsWith("_mirror");
    const bMirror = e.b.endsWith("_mirror");
    const isSelfCenterline = (e.a + "_mirror" === e.b) || (e.b + "_mirror" === e.a);
    
    if (!isSelfCenterline) {
      if (aMirror) {
        mirroredEdges.push({
          a: e.a.replace("_mirror", ""),
          b: e.b + "_mirror"
        });
      } else if (bMirror) {
        mirroredEdges.push({
          a: e.a + "_mirror",
          b: e.b.replace("_mirror", "")
        });
      } else {
        mirroredEdges.push({
          a: e.a + "_mirror",
          b: e.b + "_mirror"
        });
      }
    }
  });

  const mirroredMedals = [];
  cleanMedals.forEach(m => {
    if (m.y === 80 && m.x === 50) return;
    mirroredMedals.push({
      ...m,
      id: m.id + "_mirror",
      x: 100 - m.x,
      y: 160 - m.y
    });
  });

  return {
    finalNodes: [...cleanNodes, ...mirroredNodes],
    finalEdges: [...cleanEdges, ...mirroredEdges],
    finalMedals: [...cleanMedals, ...mirroredMedals]
  };
}

function renderEditor() {
  if (editorState.isSymmetric) {
    editorState.nodes = editorState.nodes.filter(n => !n.id.endsWith("_mirror") && n.y <= 80);
    editorState.edges = editorState.edges.filter(e => {
      const aMirror = e.a.endsWith("_mirror");
      const bMirror = e.b.endsWith("_mirror");
      return !(aMirror && bMirror);
    });
    editorState.medals = (editorState.medals || []).filter(m => !m.id.endsWith("_mirror") && m.y <= 80);
  }

  let computedNodes = [...editorState.nodes];
  let computedEdges = [...editorState.edges];
  let computedMedals = [...(editorState.medals || [])];

  if (editorState.isSymmetric) {
    const mirroredNodes = [];
    editorState.nodes.forEach(n => {
      if (n.y === 80 && n.x === 50) return;
      const ownerMirror = n.owner === 'blue' ? 'red' : (n.owner === 'red' ? 'blue' : undefined);
      mirroredNodes.push({
        ...n,
        id: n.id + "_mirror",
        x: 100 - n.x,
        y: 160 - n.y,
        owner: ownerMirror,
        isMirrored: true
      });
    });
    
    const mirroredEdges = [];
    editorState.edges.forEach(e => {
      const fromNode = computedNodes.find(n => n.id === e.a) || mirroredNodes.find(n => n.id === e.a);
      const toNode = computedNodes.find(n => n.id === e.b) || mirroredNodes.find(n => n.id === e.b);
      if (fromNode && toNode) {
        const isCenterline = (e.a + "_mirror" === e.b) || (e.b + "_mirror" === e.a);
        if (!isCenterline) {
          mirroredEdges.push({
            a: e.a.endsWith("_mirror") ? e.a.replace("_mirror", "") : e.a + "_mirror",
            b: e.b.endsWith("_mirror") ? e.b.replace("_mirror", "") : e.b + "_mirror",
            isMirrored: true
          });
        }
      }
    });

    const mirroredMedals = [];
    (editorState.medals || []).forEach(m => {
      if (m.y === 80 && m.x === 50) return;
      mirroredMedals.push({
        ...m,
        id: m.id + "_mirror",
        x: 100 - m.x,
        y: 160 - m.y,
        isMirrored: true
      });
    });

    computedNodes = [...computedNodes, ...mirroredNodes];
    computedEdges = [...computedEdges, ...mirroredEdges];
    computedMedals = [...computedMedals, ...mirroredMedals];
  }

  const nodesHtml = computedNodes.map(node => {
    let extraClass = "";
    if (node.kind === "hq") {
      extraClass = `is-hq owner-${node.owner}`;
    } else if (node.kind === "specialBase") {
      extraClass = "is-special";
    }
    const isStart = editorState.edgeStartNodeId === node.id ? "is-route-start" : "";
    const displayX = node.x;
    const displayY = (node.y / 160) * 100;

    return `
      <div 
        class="node is-compact ${extraClass} ${isStart} theme-cemetery-${node.kind === "hq" ? "hq" : node.kind === "specialBase" ? "special" : "base"} ${node.isMirrored ? 'is-mirrored' : ''}"
        style="--node-x: ${displayX}%; --node-y: ${displayY}%;"
        data-testid="editor-node-${node.id}"
        data-node-id="${node.id}"
        draggable="${node.isMirrored ? 'false' : 'true'}"
      >
        <span class="compact-node-label">${cemeteryNodeShortLabel(node.id)}</span>
      </div>
    `;
  }).join("");

  const edgesHtml = computedEdges.map(edge => {
    const fromNode = computedNodes.find(n => n.id === edge.a);
    const toNode = computedNodes.find(n => n.id === edge.b);
    if (!fromNode || !toNode) return "";
    const fromX = fromNode.x;
    const fromY = (fromNode.y / 160) * 100;
    const toX = toNode.x;
    const toY = (toNode.y / 160) * 100;
    const points = `${fromX},${fromY} ${toX},${toY}`;
    return `
      <g class="path-segment editor-path-segment ${edge.isMirrored ? 'is-mirrored' : ''}" data-testid="editor-path-${edge.a}-${edge.b}" data-from="${edge.a}" data-to="${edge.b}">
        <polyline class="path-line path-underlay" points="${points}" />
        <polyline class="path-line path-stones" points="${points}" />
      </g>
    `;
  }).join("");

  const medalsHtml = computedMedals.map(medal => {
    const displayX = medal.x;
    const displayY = (medal.y / 160) * 100;
    return `
      <div 
        class="medal-marker ${medal.isMirrored ? 'is-mirrored' : ''}"
        style="position: absolute; left: ${displayX}%; top: ${displayY}%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; background: gold; border: 2px solid white; color: black; border-radius: 50%; width: 24px; height: 24px; pointer-events: auto; z-index: 10; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"
        data-testid="editor-medal-${medal.id}"
        data-medal-id="${medal.id}"
        title="Médaille"
      >★</div>
    `;
  }).join("");

  const tools = [
    { id: "base", label: "Base Normale" },
    { id: "special", label: "Base Spéciale" },
    { id: "qg_blue", label: "Q.G. Bleu" },
    { id: "qg_red", label: "Q.G. Rouge" },
    { id: "medal", label: "Médaille (Étoile)" },
    { id: "route", label: "Dessiner Route" },
    { id: "erase", label: "Gomme (Effacer)" },
  ];

  const toolbarHtml = `
    <div class="editor-toolbar" data-testid="editor-toolbar">
      <h3>Outils de création</h3>
      <div class="editor-tools-grid">
        ${tools.map(tool => `
          <button 
            class="command-button tool-button ${editorState.selectedTool === tool.id ? "active" : ""}" 
            data-tool-id="${tool.id}"
            data-testid="editor-tool-${tool.id}"
            title="${tool.label}"
          >
            ${tool.label}
          </button>
        `).join("")}
      </div>
      <div class="editor-actions" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="display:flex; align-items:center; gap:0.5rem; color:var(--text-bright); margin-right:auto; margin-bottom: 8px; cursor: pointer;">
          <input type="checkbox" id="editor-symmetry-toggle" ${editorState.isSymmetric ? "checked" : ""}> Symétrie (Moitié sup.)
        </label>
        <div style="display: flex; gap: 8px; width: 100%;">
          <button class="command-button primary" data-testid="editor-validate-button" style="flex: 1;">Valider</button>
          <button class="command-button" data-testid="editor-cancel-button" style="flex: 1;">Annuler</button>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = `
    <header class="top-bar">
      <div class="title-block">
        <h1>Éditeur de Plateau</h1>
        <p>Dessinez votre propre terrain de jeu (100x160)</p>
      </div>
    </header>
    <div class="main-grid editor-grid-layout">
      <div class="table-area is-dense-board">
        <div class="board is-dense is-editor" data-testid="editor-board">
          <svg class="board-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${editorState.isSymmetric ? '<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.2)" stroke-dasharray="2,2" stroke-width="0.5"/>' : ''}
            ${edgesHtml}
          </svg>
          ${nodesHtml}
          ${medalsHtml}
        </div>
      </div>
      <aside class="side-panel editor-side-panel">
        ${toolbarHtml}
        <div class="editor-help-card">
          <h4>Instructions :</h4>
          <ul>
            <li>Sélectionnez un outil à droite.</li>
            <li>Cliquez sur la grille pour placer un élément.</li>
            <li>Faites glisser (drag) un élément pour le déplacer.</li>
            <li>Pour lier deux nœuds, sélectionnez <strong>Dessiner Route</strong>, cliquez sur le premier nœud puis sur le deuxième.</li>
            <li>Utilisez la <strong>Gomme</strong> pour supprimer un élément ou un lien.</li>
          </ul>
        </div>
      </aside>
    </div>
  `;
}

function handleEditorClick(event) {
  if (event.target.id === "editor-symmetry-toggle") {
    const nextSymmetric = event.target.checked;
    if (!nextSymmetric && editorState.isSymmetric) {
      const { finalNodes, finalEdges } = getMirroredState();
      editorState.nodes = finalNodes;
      editorState.edges = finalEdges;
    }
    editorState.isSymmetric = nextSymmetric;
    renderEditor();
    return;
  }

  const toolBtn = event.target.closest("[data-tool-id]");
  if (toolBtn) {
    editorState.selectedTool = toolBtn.dataset.toolId;
    editorState.edgeStartNodeId = null;
    renderEditor();
    return;
  }

  if (event.target.closest("[data-testid='editor-validate-button']")) {
    validateAndSaveCustomTerrain();
    return;
  }

  if (event.target.closest("[data-testid='editor-cancel-button']")) {
    isEditorMode = false;
    render();
    return;
  }

  const nodeEl = event.target.closest("[data-node-id]");
  const boardEl = event.target.closest(".board.is-editor");

  if (boardEl) {
    const rect = boardEl.getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * 100;
    const clickY = ((event.clientY - rect.top) / rect.height) * 160;

    if (editorState.isSymmetric && clickY > 80) {
      const allowedNodeClick = nodeEl && (editorState.selectedTool === "route" || editorState.selectedTool === "erase");
      const allowedMedalClick = event.target.closest("[data-medal-id]") && editorState.selectedTool === "erase";
      if (!allowedNodeClick && !allowedMedalClick) {
        return;
      }
    }

    let computedNodes = [...editorState.nodes];
    if (editorState.isSymmetric) {
      const mirroredNodes = [];
      editorState.nodes.forEach(n => {
        if (n.y === 80 && n.x === 50) return;
        const ownerMirror = n.owner === 'blue' ? 'red' : (n.owner === 'red' ? 'blue' : undefined);
        mirroredNodes.push({
          ...n,
          id: n.id + "_mirror",
          x: 100 - n.x,
          y: 160 - n.y,
          owner: ownerMirror
        });
      });
      computedNodes = [...computedNodes, ...mirroredNodes];
    }

    const medalEl = event.target.closest("[data-medal-id]");
    if (medalEl) {
      if (editorState.selectedTool === "erase") {
        const medalId = medalEl.dataset.medalId;
        const originalId = medalId.endsWith("_mirror") ? medalId.replace("_mirror", "") : medalId;
        editorState.medals = (editorState.medals || []).filter(m => m.id !== originalId);
        renderEditor();
      }
      return;
    }

    if (nodeEl) {
      const nodeId = nodeEl.dataset.nodeId;
      const clickedNode = computedNodes.find(n => n.id === nodeId);
      if (!clickedNode) return;

      if (editorState.selectedTool === "erase") {
        const originalId = nodeId.endsWith("_mirror") ? nodeId.replace("_mirror", "") : nodeId;
        editorState.nodes = editorState.nodes.filter(n => n.id !== originalId);
        editorState.edges = editorState.edges.filter(e => 
          e.a !== originalId && e.b !== originalId && 
          e.a !== originalId + "_mirror" && e.b !== originalId + "_mirror"
        );
        renderEditor();
        return;
      }
      if (editorState.selectedTool === "route") {
        if (!editorState.edgeStartNodeId) {
          editorState.edgeStartNodeId = nodeId;
          renderEditor();
        } else {
          const startId = editorState.edgeStartNodeId;
          const endId = nodeId;
          if (startId !== endId) {
            const exists = editorState.edges.some(e => isSameOrMirrorEdge(e, { a: startId, b: endId }));
            if (!exists) {
              editorState.edges.push({ a: startId, b: endId });
            }
          }
          editorState.edgeStartNodeId = null;
          renderEditor();
        }
        return;
      }
    } else {
      const pathEl = event.target.closest(".editor-path-segment");
      if (pathEl && editorState.selectedTool === "erase") {
        const from = pathEl.dataset.from;
        const to = pathEl.dataset.to;
        editorState.edges = editorState.edges.filter(e => !isSameOrMirrorEdge(e, { a: from, b: to }));
        renderEditor();
        return;
      }

      if (editorState.selectedTool === "erase" || editorState.selectedTool === "route") {
        return;
      }

      if (editorState.selectedTool === "medal") {
        let counter = 1;
        while ((editorState.medals || []).some(m => m.id === `m_${counter}`)) {
          counter++;
        }
        if (!editorState.medals) editorState.medals = [];
        editorState.medals.push({
          id: `m_${counter}`,
          x: Math.round(clickX),
          y: Math.round(clickY)
        });
        renderEditor();
        return;
      }

      let kind = "base";
      let owner = undefined;
      let prefix = "p_";

      if (editorState.selectedTool === "qg_blue") {
        kind = "hq";
        owner = "blue";
        prefix = "qg_blue";
        editorState.nodes = editorState.nodes.filter(n => n.id !== "qg_blue");
      } else if (editorState.selectedTool === "qg_red") {
        kind = "hq";
        owner = "red";
        prefix = "qg_red";
        editorState.nodes = editorState.nodes.filter(n => n.id !== "qg_red");
      } else if (editorState.selectedTool === "special") {
        kind = "specialBase";
        prefix = "sp_";
      }

      let nodeId;
      if (kind === "hq") {
        nodeId = prefix;
      } else {
        let counter = 1;
        while (editorState.nodes.some(n => n.id === `${prefix}${counter}`)) {
          counter++;
        }
        nodeId = `${prefix}${counter}`;
      }

      editorState.nodes.push({
        id: nodeId,
        kind,
        x: Math.round(clickX),
        y: Math.round(clickY),
        owner
      });
      renderEditor();
    }
  }
}

function validateAndSaveCustomTerrain() {
  const issues = [];
  
  let finalNodes = [...editorState.nodes];
  let finalEdges = [...editorState.edges];
  let finalMedals = [...(editorState.medals || [])];

  if (editorState.isSymmetric) {
    const { finalNodes: fn, finalEdges: fe, finalMedals: fm } = getMirroredState();
    finalNodes = fn;
    finalEdges = fe;
    finalMedals = fm;
  }

  const uniqueNodes = [];
  const seenNodeIds = new Set();
  finalNodes.forEach(n => {
    if (!seenNodeIds.has(n.id)) {
      seenNodeIds.add(n.id);
      uniqueNodes.push(n);
    }
  });

  const uniqueEdges = [];
  const seenEdges = new Set();
  finalEdges.forEach(e => {
    const key1 = `${e.a}->${e.b}`;
    const key2 = `${e.b}->${e.a}`;
    if (!seenEdges.has(key1) && !seenEdges.has(key2)) {
      seenEdges.add(key1);
      seenEdges.add(key2);
      uniqueEdges.push(e);
    }
  });

  const uniqueMedals = [];
  const seenMedalIds = new Set();
  finalMedals.forEach(m => {
    if (!seenMedalIds.has(m.id)) {
      seenMedalIds.add(m.id);
      uniqueMedals.push(m);
    }
  });

  const blueHq = uniqueNodes.find(n => n.kind === "hq" && n.owner === "blue");
  const redHq = uniqueNodes.find(n => n.kind === "hq" && n.owner === "red");
  if (!blueHq) issues.push("Le Q.G. Bleu est manquant.");
  if (!redHq) issues.push("Le Q.G. Rouge est manquant.");

  if (blueHq) {
    const hasConnection = uniqueEdges.some(e => e.a === blueHq.id || e.b === blueHq.id);
    if (!hasConnection) issues.push("Le Q.G. Bleu n'est connecté à aucun chemin.");
  }
  if (redHq) {
    const hasConnection = uniqueEdges.some(e => e.a === redHq.id || e.b === redHq.id);
    if (!hasConnection) issues.push("Le Q.G. Rouge n'est connecté à aucun chemin.");
  }

  const bases = uniqueNodes.filter(n => n.kind === "base" || n.kind === "specialBase");
  if (uniqueMedals.length > 0 && bases.length === 0) {
    issues.push("Vous devez placer au moins une base pour pouvoir placer des médailles.");
  }

  if (issues.length > 0) {
    alert("Erreur de validation :\n\n" + issues.map(iss => "- " + iss).join("\n"));
    return;
  }

  const defaultCount = terrainOptions.filter(t => t.id.startsWith("custom-")).length + 1;
  const terrainName = prompt("Entrez un nom pour votre terrain personnalisé :", `Terrain Personnalisé ${defaultCount}`);
  if (terrainName === null) {
    return; // User clicked Cancel
  }
  const displayName = terrainName.trim() || `Terrain Personnalisé ${defaultCount}`;

  // Automatically generate regions and medal spaces
  const regions = [];
  const medalSpaces = [];
  uniqueMedals.forEach((m, idx) => {
    const bases = uniqueNodes.filter(n => n.kind === "base" || n.kind === "specialBase");
    const sortedBases = [...bases].sort((a, b) => {
      const distA = Math.hypot(a.x - m.x, a.y - m.y);
      const distB = Math.hypot(b.x - m.x, b.y - m.y);
      return distA - distB;
    });
    const closestBases = sortedBases.slice(0, 3);
    const boundaryBaseIds = closestBases.map(b => b.id);
    const regionId = `r_custom_medal_${idx + 1}`;
    
    if (boundaryBaseIds.length > 0) {
      regions.push({
        id: regionId,
        boundaryBaseIds: boundaryBaseIds,
        medalSpaceIds: [m.id]
      });
    }
    
    medalSpaces.push({
      id: m.id,
      regionId: regionId,
      initialValue: 1,
      x: m.x,
      y: m.y
    });
  });

  const totalMedals = uniqueMedals.length;
  const requiredObjective = totalMedals > 0 ? Math.ceil((totalMedals + 1) / 2) : 2;

  const customTerrainId = `custom-${Date.now()}`;
  const customTerrain = {
    id: customTerrainId,
    displayName: displayName,
    nodes: uniqueNodes.map(n => ({
      id: n.id,
      kind: n.kind,
      x: n.x,
      y: n.y,
      label: n.kind === "hq" ? `Q.G. ${n.owner === "blue" ? "bleu" : "rouge"}` : (n.kind === "specialBase" ? "Citrouille" : "Base"),
      shape: n.kind === "hq" ? undefined : (n.kind === "specialBase" ? "pumpkin" : "large-square"),
      owner: n.owner,
      specialBaseEffect: n.kind === "specialBase" ? "recoverOwnDiscardToSupport" : undefined,
    })),
    edges: uniqueEdges.map((e, idx) => ({
      id: `e_custom_${idx + 1}`,
      a: e.a,
      b: e.b,
      via: [],
    })),
    regions: regions,
    medalSpaces: medalSpaces,
    specialRules: [],
    objectives: {
      blue: { requiredCount: requiredObjective },
      red: { requiredCount: requiredObjective },
    },
    coordinateSystem: {
      width: 100,
      height: 160,
    },
    transcriptionStatus: "partial",
  };

  try {
    registerCustomTerrainLayout(customTerrain);
    terrainOptions.push(customTerrain);
    
    // Save to localStorage
    try {
      const customOnly = terrainOptions.filter(t => t.id.startsWith("custom-"));
      localStorage.setItem("toy-battle-custom-terrains", JSON.stringify(customOnly));
    } catch (e) {
      console.error("Failed to save custom terrains to localStorage", e);
    }

    selectedTerrainId = customTerrainId;
    controller = createControllerForTerrain(selectedTerrainId, selectedGameMode);
    
    editorState.nodes = uniqueNodes;
    editorState.edges = uniqueEdges;
    editorState.medals = uniqueMedals;
    editorState.isSymmetric = false;

    isEditorMode = false;
    render();
  } catch (error) {
    terrainOptions.pop();
    alert(`Erreur d'initialisation du terrain par le moteur de jeu :\n\n${error.message}`);
  }
}

app.addEventListener("dragstart", (event) => {
  if (!isEditorMode) return;
  const target = event.target.closest("[data-node-id]");
  if (target) {
    const nodeId = target.dataset.nodeId;
    if (nodeId.endsWith("_mirror")) {
      event.preventDefault();
      return;
    }
    editorState.draggedNodeId = nodeId;
  }
});

app.addEventListener("dragover", (event) => {
  if (!isEditorMode) return;
  event.preventDefault();
});

app.addEventListener("drop", (event) => {
  if (!isEditorMode || !editorState.draggedNodeId) return;
  const boardEl = event.target.closest(".board.is-editor");
  if (boardEl) {
    const rect = boardEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, Math.round(((event.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(0, Math.min(160, Math.round(((event.clientY - rect.top) / rect.height) * 160)));

    if (editorState.isSymmetric && y > 80) {
      editorState.draggedNodeId = null;
      return;
    }

    const node = editorState.nodes.find(n => n.id === editorState.draggedNodeId);
    if (node) {
      node.x = x;
      node.y = y;
      renderEditor();
    }
  }
  editorState.draggedNodeId = null;
});

function render() {
  if (isEditorMode) {
    renderEditor();
    return;
  }
  const snapshot = controller.getSnapshot();
  const { view, uiState, notice } = snapshot;

  let bottomPlayer, sidePlayer;
  if (selectedGameMode === "vs-human") {
    const activePlayerId = view.turn.currentPlayer;
    bottomPlayer = view.players[activePlayerId];
    sidePlayer = view.players[activePlayerId === "blue" ? "red" : "blue"];
  } else {
    bottomPlayer = view.players[HUMAN_PLAYER];
    sidePlayer = view.players[AI_PLAYER];
  }

  app.innerHTML = `
    <div class="sr-status" aria-live="polite" data-testid="sr-status">${uiState.prompt}</div>
    <header class="top-bar">
      <div class="title-block">
        <h1>Toy Battle</h1>
        <p data-testid="terrain-name">${view.terrain.displayName} - human vs AI</p>
      </div>
      ${renderTerrainControls(view)}
      <div class="score-row">
        ${Object.values(view.players).map((player) => {
          const remaining = Math.max(0, player.objectiveMedals - player.medals.length);
          const starsHtml = Array.from({ length: player.objectiveMedals }).map((_, idx) => {
            const isClaimed = idx < player.medals.length;
            return `<span class="reservoir-star ${isClaimed ? 'is-claimed' : 'is-empty'}" style="font-size:1.1rem; color:${isClaimed ? '#f3b629' : 'rgba(0,0,0,0.15)'}; margin-right:2px;">★</span>`;
          }).join("");
          const displayName = player.id === 'blue' ? 'Joueur Bleu' : 'Joueur Rouge';
          return `
            <div class="score-pill ${player.id}" data-testid="score-${player.id}" style="display:flex; flex-direction:column; gap:4px; min-width:130px;">
              <strong style="text-transform: capitalize;">${displayName}</strong>
              <div class="star-reservoir" style="display:flex; align-items:center;">
                ${starsHtml}
              </div>
              <span style="font-size:0.78rem; color:var(--muted); font-weight:600;">
                ${player.medals.length} / ${player.objectiveMedals}
                ${remaining === 0 ? ' (Victoire !)' : ` (reste ${remaining})`}
              </span>
            </div>
          `;
        }).join("")}
      </div>
    </header>
    <div class="main-grid">
      ${renderBoard(view, uiState, snapshot)}
      <aside class="side-panel">
        ${renderDecisionPanel(snapshot)}
        <div class="control-strip">
          <button class="command-button primary" data-testid="draw-button" ${snapshot.controls.canDraw ? "" : "disabled"}>Piocher</button>
          <button class="command-button" data-testid="reset-button">Nouvelle Partie</button>
          <button class="command-button" data-testid="tutorial-start-button" ${snapshot.controls.canStartTutorial ? "" : "disabled"}>Tutoriel</button>
        </div>
        ${renderTutorialPanel(snapshot)}
        ${renderCounters(view)}
        ${renderSupport(sidePlayer, uiState)}
        ${renderLog(view)}
      </aside>
    </div>
    <section class="hand-area">
      ${renderSupport(bottomPlayer, uiState)}
    </section>
  `;
}

app.addEventListener("click", (event) => {
  if (isEditorMode) {
    handleEditorClick(event);
    return;
  }

  const target = event.target.closest(
    "[data-testid='draw-button'], [data-testid='reset-button'], [data-testid='tutorial-start-button'], [data-testid='tutorial-next-button'], [data-testid='tutorial-exit-button'], [data-testid='tutorial-invalid-placement-button'], [data-testid='apply-effect-button'], [data-testid='skip-effect-button'], [data-testid^='support-slot-blue-'], [data-testid^='support-slot-red-'], [data-testid^='board-node-'], [data-testid='editor-open-button']",
  );
  if (!target) return;

  if (target.dataset.testid === "editor-open-button") {
    isEditorMode = true;
    editorState = {
      nodes: [],
      edges: [],
      medals: [],
      selectedTool: "base",
      draggedNodeId: null,
      edgeStartNodeId: null,
      isSymmetric: true,
    };
    renderEditor();
    return;
  }

  if (target.dataset.testid === "tutorial-start-button") {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.START_TUTORIAL));
    return;
  }
  if (target.dataset.testid === "tutorial-next-button") {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.ADVANCE_TUTORIAL));
    return;
  }
  if (target.dataset.testid === "tutorial-exit-button") {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.EXIT_TUTORIAL));
    return;
  }
  if (target.dataset.testid === "tutorial-invalid-placement-button") {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.EXPLAIN_INVALID_PLACEMENT));
    return;
  }
  if (target.dataset.testid === "draw-button") {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.DRAW));
    return;
  }
  if (target.dataset.testid === "apply-effect-button") {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.APPLY_EFFECT));
    return;
  }
  if (target.dataset.testid === "skip-effect-button") {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.SKIP_EFFECT));
    return;
  }
  if (target.dataset.testid === "reset-button") {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.RESET_GAME));
    return;
  }
  if (target.dataset.testid?.startsWith("support-slot-")) {
    const troopId = target.dataset.troopId;
    if (troopId) controller.dispatch(createUiIntent(UI_ACTION_TYPES.SELECT_TROOP, { troopId }));
    return;
  }
  if (target.dataset.testid?.startsWith("board-node-")) {
    controller.dispatch(createUiIntent(UI_ACTION_TYPES.INSPECT_NODE, { nodeId: target.dataset.nodeId }));
    if (controller.isLegalPlacement(target.dataset.nodeId)) {
      controller.dispatch(createUiIntent(UI_ACTION_TYPES.PLACE_TROOP, { targetNodeId: target.dataset.nodeId }));
    }
  }
});

app.addEventListener("mouseover", (event) => {
  if (isEditorMode) return;
  const target = event.target.closest("[data-testid^='board-node-']");
  if (target?.dataset.nodeId) {
    const snapshot = controller.getSnapshot();
    if (snapshot.uiState.inspectedNodeId !== target.dataset.nodeId) {
      controller.dispatch(createUiIntent(UI_ACTION_TYPES.INSPECT_NODE, { nodeId: target.dataset.nodeId }));
    }
  }
});

app.addEventListener("focusin", (event) => {
  if (isEditorMode) return;
  const target = event.target.closest("[data-testid^='board-node-']");
  if (target?.dataset.nodeId) {
    const snapshot = controller.getSnapshot();
    if (snapshot.uiState.inspectedNodeId !== target.dataset.nodeId) {
      controller.dispatch(createUiIntent(UI_ACTION_TYPES.INSPECT_NODE, { nodeId: target.dataset.nodeId }));
    }
  }
});

app.addEventListener("change", (event) => {
  const terrainTarget = event.target.closest("[data-testid='terrain-select']");
  if (terrainTarget && terrainTarget.value !== selectedTerrainId) {
    selectedTerrainId = terrainTarget.value;
    controller = createControllerForTerrain(selectedTerrainId, selectedGameMode);
    render();
    return;
  }
  const modeTarget = event.target.closest("[data-testid='mode-select']");
  if (modeTarget && modeTarget.value !== selectedGameMode) {
    selectedGameMode = modeTarget.value;
    controller = createControllerForTerrain(selectedTerrainId, selectedGameMode);
    render();
    return;
  }
});

render();
