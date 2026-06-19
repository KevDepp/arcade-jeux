const TERRAIN_GAPS = Object.freeze([
  "Official sources used by this project do not provide a structured graph table for nodes/edges.",
  "Objective values by side/orientation are not available as trusted structured data.",
  "Region boundaries and medal placements are not available as trusted structured data.",
  "This terrain must not be treated as transcribed or reviewed until board data is manually transcribed and checked.",
]);

const CEMETERY_SPECIAL_BASE_EFFECT = Object.freeze({
  kind: "recoverOwnDiscardToSupport",
  maxSupportSize: 8,
  source: "Official cemetery special-base rule; positioned by data/reference/rework/cemetery_spatial_analysis.md",
});

const CEMETERY_UNRESOLVED_NOTES = Object.freeze([
  "The physical reference image still has right-edge crop and left glare; strict visual comparison remains partial.",
  "User correction 2026-05-15: Toy Battle boards have one playable position type. On the cemetery board these are the large stone slabs; the previously modelled small grave-shaped positions are decorative tombs, not playable bases.",
  "The corrected cemetery graph keeps only Q.G., pumpkin special bases, and large slab playable positions; grave coordinates are retained only as visual route/decor hints.",
  "User route correction 2026-05-15: the cemetery route graph is symmetric under 180 degree rotation; Q.G. nodes connect to normal slabs, never directly to pumpkin special bases.",
  "User route correction 2026-05-15 follow-up: routes are logical case-to-case paths, including special bases, with one edge per pair of cases; visual via points must not make a route look like it terminates on another route.",
  "User route correction 2026-05-15 second follow-up: the second-line slab between the two upper pumpkin bases has no route toward the center, and the two upper pumpkin bases have no route to the slab above them; the same removals apply by 180 degree rotation.",
  "Region boundaries and medal geometry are not part of cemetery_spatial_analysis.md and remain unverified, so they are not modelled as official T-050 regions.",
]);

function cemeterySpatialNode(id, definition) {
  const kind = definition.type === "qg" ? "hq" : definition.type === "special" ? "specialBase" : "base";
  return Object.freeze({
    id,
    kind,
    label: definition.label,
    x: definition.x,
    y: definition.y,
    coordinateSystem: "T-050-normalized-100x160",
    source: `data/reference/rework/cemetery_spatial_analysis.md:${id}`,
    shape: definition.shape ?? definition.special ?? "large-square",
    zone: definition.zone ?? null,
    owner: definition.team ?? undefined,
    specialBaseEffect: kind === "specialBase" ? CEMETERY_SPECIAL_BASE_EFFECT : undefined,
  });
}

function cemeteryRoute(from, to, via = []) {
  return Object.freeze({
    from,
    to,
    via: Object.freeze(via.map((point) => Object.freeze(point))),
  });
}

const CEMETERY_SPATIAL_ANALYSIS_MODEL = Object.freeze({
  id: "cimetiere_maudit_v1",
  coordinateSystem: Object.freeze({
    width: 100,
    height: 160,
    origin: "top-left",
    source: "data/reference/rework/cemetery_spatial_analysis.md",
  }),
  symmetry: Object.freeze({
    kind: "rotation",
    degrees: 180,
    note: "The cemetery board is symmetric by 180 degree rotation, not left/right mirror symmetry.",
  }),
  nodes: Object.freeze({
    qg_blue: Object.freeze({ type: "qg", team: "blue", x: 83, y: 12, label: "QG bleu" }),
    qg_red: Object.freeze({ type: "qg", team: "red", x: 17, y: 148, label: "QG rouge" }),
    sp_nw_pumpkin: Object.freeze({ type: "special", special: "pumpkin", zone: "north-west", x: 15, y: 28, label: "Citrouille nord-ouest" }),
    sp_ne_pumpkin: Object.freeze({ type: "special", special: "pumpkin", zone: "north-east", x: 84, y: 28, label: "Citrouille nord-est" }),
    sp_sw_pumpkin: Object.freeze({ type: "special", special: "pumpkin", zone: "south-west", x: 16, y: 132, label: "Citrouille sud-ouest" }),
    sp_se_pumpkin: Object.freeze({ type: "special", special: "pumpkin", zone: "south-east", x: 85, y: 132, label: "Citrouille sud-est" }),
    p_top_left_square: Object.freeze({ type: "position", shape: "large-square", x: 28, y: 12, label: "Grande dalle nord-ouest" }),
    p_top_center_square: Object.freeze({ type: "position", shape: "large-square", x: 50, y: 28, label: "Grande dalle nord-centre" }),
    p_mid_left_square: Object.freeze({ type: "position", shape: "large-square", x: 34, y: 51, label: "Grande dalle centre-ouest" }),
    p_mid_right_square: Object.freeze({ type: "position", shape: "large-square", x: 69, y: 51, label: "Grande dalle centre-est" }),
    p_center_square: Object.freeze({ type: "position", shape: "large-square", x: 50, y: 80, label: "Grande dalle centrale" }),
    p_left_middle_square: Object.freeze({ type: "position", shape: "large-square", x: 15, y: 80, label: "Grande dalle bord gauche" }),
    p_right_middle_square: Object.freeze({ type: "position", shape: "large-square", x: 85, y: 80, label: "Grande dalle bord droit" }),
    p_lower_left_square: Object.freeze({ type: "position", shape: "large-square", x: 31, y: 109, label: "Grande dalle sud-ouest" }),
    p_lower_right_square: Object.freeze({ type: "position", shape: "large-square", x: 66, y: 109, label: "Grande dalle sud-est" }),
    p_bottom_center_square: Object.freeze({ type: "position", shape: "large-square", x: 50, y: 132, label: "Grande dalle bas-centre" }),
    p_bottom_right_square: Object.freeze({ type: "position", shape: "large-square", x: 72, y: 148, label: "Grande dalle bas-droite" }),
  }),
  routes: Object.freeze([
    cemeteryRoute("p_bottom_right_square", "sp_se_pumpkin"),
    cemeteryRoute("p_top_left_square", "sp_nw_pumpkin"),
    cemeteryRoute("sp_sw_pumpkin", "p_bottom_center_square"),
    cemeteryRoute("sp_ne_pumpkin", "p_top_center_square"),
    cemeteryRoute("qg_blue", "p_top_center_square"),
    cemeteryRoute("qg_blue", "p_top_left_square"),
    cemeteryRoute("sp_ne_pumpkin", "p_mid_right_square"),
    cemeteryRoute("p_top_left_square", "p_top_center_square"),
    cemeteryRoute("sp_nw_pumpkin", "p_mid_left_square"),
    cemeteryRoute("p_top_left_square", "p_mid_left_square"),
    
    cemeteryRoute("p_top_center_square", "p_mid_right_square"),
    cemeteryRoute("p_mid_left_square", "p_center_square"),
    cemeteryRoute("p_mid_right_square", "p_center_square"),
    cemeteryRoute("p_center_square", "p_left_middle_square"),
    cemeteryRoute("p_center_square", "p_right_middle_square"),
    cemeteryRoute("p_mid_left_square", "p_left_middle_square"),
    cemeteryRoute("p_left_middle_square", "p_lower_left_square"),
    cemeteryRoute("p_mid_right_square", "p_right_middle_square"),
    cemeteryRoute("p_right_middle_square", "p_lower_right_square"),
    cemeteryRoute("p_center_square", "p_lower_left_square"),
    cemeteryRoute("p_center_square", "p_lower_right_square"),
    cemeteryRoute("p_mid_left_square", "p_mid_right_square"),
    cemeteryRoute("p_lower_left_square", "p_lower_right_square"),
    cemeteryRoute("p_lower_left_square", "p_bottom_center_square"),
    
    cemeteryRoute("p_bottom_center_square", "p_bottom_right_square"),
    cemeteryRoute("p_lower_left_square", "sp_sw_pumpkin"),
    cemeteryRoute("qg_red", "p_bottom_center_square"),
    cemeteryRoute("qg_red", "p_bottom_right_square"),
    cemeteryRoute("p_lower_right_square", "sp_se_pumpkin"),
    cemeteryRoute("p_bottom_right_square", "p_lower_right_square"),
  ]),
});

function cemeteryEdgesFromSpatialRoutes(routes) {
  return Object.freeze(routes.map((route, index) => Object.freeze({
    id: `cemetery-spatial-edge-${String(index + 1).padStart(2, "0")}`,
    a: route.from,
    b: route.to,
    via: route.via,
    source: "data/reference/rework/cemetery_spatial_analysis.md",
  })));
}

const cursedCemeteryTerrainData = Object.freeze({
  transcriptionStatus: "transcribed",
  nodes: Object.freeze(Object.entries(CEMETERY_SPATIAL_ANALYSIS_MODEL.nodes).map(([id, definition]) => cemeterySpatialNode(id, definition))),
  edges: cemeteryEdgesFromSpatialRoutes(CEMETERY_SPATIAL_ANALYSIS_MODEL.routes),
  regions: Object.freeze([
    Object.freeze({
      id: "R_NW_PUMPKIN",
      boundaryBaseIds: Object.freeze(["p_top_left_square", "sp_nw_pumpkin", "p_mid_left_square"]),
      medalSpaceIds: Object.freeze(["m-nw-1"]),
    }),
    Object.freeze({
      id: "R_UPPER_LEFT_CENTER",
      boundaryBaseIds: Object.freeze(["p_top_left_square", "p_top_center_square", "p_mid_right_square", "p_mid_left_square"]),
      medalSpaceIds: Object.freeze(["m-ulc-1", "m-ulc-2"]),
    }),
    Object.freeze({
      id: "R_NE_PUMPKIN",
      boundaryBaseIds: Object.freeze(["sp_ne_pumpkin", "p_top_center_square", "p_mid_right_square"]),
      medalSpaceIds: Object.freeze(["m-ne-1"]),
    }),
    Object.freeze({
      id: "R_CENTER_UPPER_TRIANGLE",
      boundaryBaseIds: Object.freeze(["p_mid_left_square", "p_mid_right_square", "p_center_square"]),
      medalSpaceIds: Object.freeze(["m-cut-1"]),
    }),
    Object.freeze({
      id: "R_CENTER_LEFT",
      boundaryBaseIds: Object.freeze(["p_left_middle_square", "p_mid_left_square", "p_center_square", "p_lower_left_square"]),
      medalSpaceIds: Object.freeze(["m-cl-1", "m-cl-2"]),
    }),
    Object.freeze({
      id: "R_CENTER_RIGHT",
      boundaryBaseIds: Object.freeze(["p_right_middle_square", "p_lower_right_square", "p_center_square", "p_mid_right_square"]),
      medalSpaceIds: Object.freeze(["m-cr-1", "m-cr-2"]),
    }),
    Object.freeze({
      id: "R_CENTER_LOWER",
      boundaryBaseIds: Object.freeze(["p_lower_left_square", "p_lower_right_square", "p_center_square"]),
      medalSpaceIds: Object.freeze(["m-clt-1"]),
    }),
    Object.freeze({
      id: "R_LOWER_CENTER",
      boundaryBaseIds: Object.freeze(["p_bottom_right_square", "p_bottom_center_square", "p_lower_left_square", "p_lower_right_square"]),
      medalSpaceIds: Object.freeze(["m-lc-1", "m-lc-2"]),
    }),
    Object.freeze({
      id: "R_SW_PUMPKIN",
      boundaryBaseIds: Object.freeze(["sp_sw_pumpkin", "p_bottom_center_square", "p_lower_left_square"]),
      medalSpaceIds: Object.freeze(["m-sw-1"]),
    }),
    Object.freeze({
      id: "R_SE_PUMPKIN",
      boundaryBaseIds: Object.freeze(["p_bottom_right_square", "sp_se_pumpkin", "p_lower_right_square"]),
      medalSpaceIds: Object.freeze(["m-se-1"]),
    }),
  ]),
  medalSpaces: Object.freeze([
    Object.freeze({ id: "m-nw-1", regionId: "R_NW_PUMPKIN", initialValue: 1, x: 23, y: 32 }),
    Object.freeze({ id: "m-ulc-1", regionId: "R_UPPER_LEFT_CENTER", initialValue: 1, x: 38, y: 35.2 }),
    Object.freeze({ id: "m-ulc-2", regionId: "R_UPPER_LEFT_CENTER", initialValue: 1, x: 48, y: 35.2 }),
    Object.freeze({ id: "m-ne-1", regionId: "R_NE_PUMPKIN", initialValue: 1, x: 77, y: 32 }),
    Object.freeze({ id: "m-cut-1", regionId: "R_CENTER_UPPER_TRIANGLE", initialValue: 1, x: 50, y: 60.8 }),
    Object.freeze({ id: "m-cl-1", regionId: "R_CENTER_LEFT", initialValue: 1, x: 32, y: 67.2 }),
    Object.freeze({ id: "m-cl-2", regionId: "R_CENTER_LEFT", initialValue: 1, x: 32, y: 92.8 }),
    Object.freeze({ id: "m-cr-1", regionId: "R_CENTER_RIGHT", initialValue: 1, x: 68, y: 67.2 }),
    Object.freeze({ id: "m-cr-2", regionId: "R_CENTER_RIGHT", initialValue: 1, x: 68, y: 92.8 }),
    Object.freeze({ id: "m-clt-1", regionId: "R_CENTER_LOWER", initialValue: 1, x: 50, y: 99.2 }),
    Object.freeze({ id: "m-lc-1", regionId: "R_LOWER_CENTER", initialValue: 1, x: 62, y: 124.8 }),
    Object.freeze({ id: "m-lc-2", regionId: "R_LOWER_CENTER", initialValue: 1, x: 52, y: 124.8 }),
    Object.freeze({ id: "m-sw-1", regionId: "R_SW_PUMPKIN", initialValue: 1, x: 23, y: 128 }),
    Object.freeze({ id: "m-se-1", regionId: "R_SE_PUMPKIN", initialValue: 1, x: 77, y: 128 }),
  ]),
  objectives: Object.freeze({
    blue: Object.freeze({ requiredCount: 7, source: "Cemetery terrain objective symmetry" }),
    red: Object.freeze({ requiredCount: 7, source: "Cemetery terrain objective symmetry" }),
  }),
  setup: Object.freeze({
    hqByPlayer: Object.freeze({
      blue: Object.freeze(["qg_blue"]),
      red: Object.freeze(["qg_red"]),
    }),
  }),
  sourceReferences: Object.freeze([
    "data/reference/rework/cemetery_spatial_analysis.md",
    "data/tasks/T-023_rework_reference_intake/rework_impact_report.md",
    "private-cemetery-text-transcription-held-outside-runtime-assets",
    "private-cemetery-visual-reference-held-outside-runtime-assets",
  ]),
  coordinateSystem: Object.freeze({
    width: 100,
    height: 160,
    origin: "top-left",
    status: "normalized-corrected-single-position-type-with-decorative-graves",
  }),
  spatialModel: CEMETERY_SPATIAL_ANALYSIS_MODEL,
  requiredTranscription: Object.freeze({
    needsBoardGraph: false,
    needsObjectives: false,
    needsRegions: false,
    needsMedalSpaces: false,
    needsRestrictionValues: false,
    expectedHqByPlayer: Object.freeze({ blue: 1, red: 1 }),
    source: "Post-run user correction: grave-shaped items are decorative tombs, not playable positions; regions and medal geometry still need review before transcribed/reviewed status",
  }),
  unresolvedDataNotes: Object.freeze([]),
});

function terrain(definition) {
  return Object.freeze({
    official: true,
    transcriptionStatus: "placeholder",
    nodes: Object.freeze([]),
    edges: Object.freeze([]),
    regions: Object.freeze([]),
    medalSpaces: Object.freeze([]),
    objectives: Object.freeze({}),
    setup: Object.freeze({ hqByPlayer: Object.freeze({ blue: Object.freeze([]), red: Object.freeze([]) }) }),
    unresolvedDataNotes: TERRAIN_GAPS,
    ...definition,
    specialRules: Object.freeze(definition.specialRules ?? []),
    requiredTranscription: Object.freeze({
      needsBoardGraph: definition.requiredTranscription?.needsBoardGraph ?? true,
      needsObjectives: definition.requiredTranscription?.needsObjectives ?? true,
      needsRegions: definition.requiredTranscription?.needsRegions ?? true,
      needsMedalSpaces: definition.requiredTranscription?.needsMedalSpaces ?? true,
      needsRestrictionValues: definition.requiredTranscription?.needsRestrictionValues ?? false,
      expectedHqByPlayer: definition.requiredTranscription?.expectedHqByPlayer ?? "unresolved",
      source: definition.requiredTranscription?.source ?? "manualBoardTranscriptionRequired",
    }),
  });
}

export const officialTerrains = Object.freeze([
  terrain({
    id: "la-plaine-des-chateaux",
    displayName: "La plaine des chateaux",
    specialRules: [
      Object.freeze({
        kind: "specialBaseEffect",
        effect: "returnAnotherVisibleOwnTroopToSupport",
        maxSupportSize: 8,
        target: "anotherVisibleOwnTroopAnywhere",
      }),
    ],
  }),
  terrain({
    id: "la-piscine-des-tropiques",
    displayName: "La piscine des tropiques",
    specialRules: [
      Object.freeze({
        kind: "placementRestrictionsByNode",
        appliesTo: "printedRestrictedSpecialBasesAndHqs",
        sourceStatus: "valuesRequireManualBoardTranscription",
      }),
    ],
    requiredTranscription: { needsRestrictionValues: true },
  }),
  terrain({
    id: "la-cite-des-nuages",
    displayName: "La cite des nuages",
    specialRules: [
      Object.freeze({
        kind: "specialBaseEffect",
        effect: "drawOneFromReserve",
        maxSupportSize: 8,
      }),
    ],
  }),
  terrain({
    id: "la-jungle-volcanique",
    displayName: "La jungle volcanique",
    specialRules: [
      Object.freeze({
        kind: "specialBaseEffect",
        effect: "moveAdjacentVisibleEnemyTroop",
        destination: "adjacentBaseIgnoringPlacementRules",
      }),
    ],
  }),
  terrain({
    id: "le-cimetiere-maudit",
    displayName: "Le cimetiere maudit",
    ...cursedCemeteryTerrainData,
    specialRules: [
      Object.freeze({
        kind: "specialBaseEffect",
        effect: "recoverOwnDiscardToSupport",
        maxSupportSize: 8,
      }),
    ],
  }),
  terrain({
    id: "la-mer-des-caraibes",
    displayName: "La mer des Caraibes",
    specialRules: [
      Object.freeze({
        kind: "asymmetricHq",
        hqByPlayer: Object.freeze({ blue: 2, red: 1 }),
        specialBaseEffects: "none",
      }),
    ],
    requiredTranscription: { expectedHqByPlayer: Object.freeze({ blue: 2, red: 1 }) },
  }),
  terrain({
    id: "la-station-metal-x",
    displayName: "La station Metal-X",
    specialRules: [
      Object.freeze({
        kind: "specialBaseEffect",
        effect: "suppressPlacedTroopEffect",
      }),
    ],
  }),
  terrain({
    id: "le-champ-de-bataille",
    displayName: "Le champ de bataille",
    specialRules: [
      Object.freeze({
        kind: "specialBaseEffect",
        effect: "markOpponentSupportTroopUnavailableNextTurn",
        selection: "withoutLooking",
      }),
    ],
  }),
]);

export const OFFICIAL_TERRAIN_IDS = Object.freeze(officialTerrains.map((item) => item.id));

export const officialTerrainById = Object.freeze(Object.fromEntries(officialTerrains.map((item) => [item.id, item])));

export function getOfficialTerrain(id) {
  const terrainDefinition = officialTerrainById[id];
  if (!terrainDefinition) throw new Error(`Unknown official terrain: ${id}`);
  return terrainDefinition;
}



