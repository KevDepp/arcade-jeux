export const PLAYERS = /** @type {const} */ (["blue", "red"]);

export const TROOP_CATALOG = Object.freeze({
  kwak: Object.freeze({
    type: "kwak",
    displayName: "Kwak",
    force: "joker",
    copiesPerColor: 3,
    effect: { kind: "none" },
  }),
  skully: Object.freeze({
    type: "skully",
    displayName: "Skully",
    force: 1,
    copiesPerColor: 3,
    effect: { kind: "drawFromReserve", count: 2, capSupportAt: 8, optional: true },
  }),
  captaine: Object.freeze({
    type: "captaine",
    displayName: "Cap'taine",
    force: 2,
    copiesPerColor: 3,
    effect: { kind: "placeAdditionalTroop", optional: true, queueSpecialBaseEffectsUntilTroopChainEnds: true },
  }),
  mastok: Object.freeze({
    type: "mastok",
    displayName: "Mastok",
    force: 3,
    copiesPerColor: 3,
    effect: { kind: "discardAdjacentEnemy", optional: true, target: "visibleAdjacentEnemyTroop" },
  }),
  crochet: Object.freeze({
    type: "crochet",
    displayName: "Crochet",
    force: 4,
    copiesPerColor: 3,
    effect: { kind: "ignoreConnectionForBasePlacement", optional: false, appliesTo: "baseOnly" },
  }),
  xb42: Object.freeze({
    type: "xb42",
    displayName: "XB-42",
    force: 5,
    copiesPerColor: 3,
    effect: { kind: "discardRandomOpponentSupport", optional: true, revealWhenDiscarded: true },
  }),
  star: Object.freeze({
    type: "star",
    displayName: "Star",
    force: 6,
    copiesPerColor: 3,
    effect: { kind: "drawFromReserve", count: 1, capSupportAt: 8, optional: true },
  }),
  roxy: Object.freeze({
    type: "roxy",
    displayName: "Roxy",
    force: 7,
    copiesPerColor: 3,
    effect: { kind: "none" },
  }),
});

export const TROOP_TYPES = Object.freeze(Object.keys(TROOP_CATALOG));

export function getTroopDefinition(type) {
  const definition = TROOP_CATALOG[type];
  if (!definition) throw new Error(`Unknown troop type: ${type}`);
  return definition;
}

export function createTroopInstancesForPlayer(player) {
  return TROOP_TYPES.flatMap((type) =>
    Array.from({ length: TROOP_CATALOG[type].copiesPerColor }, (_, copyIndex) => ({
      id: `${player}-${type}-${copyIndex + 1}`,
      type,
      owner: player,
      location: { zone: "reserve", owner: player, index: -1, visibility: "hidden" },
    })),
  );
}
