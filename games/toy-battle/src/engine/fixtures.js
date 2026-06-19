export const syntheticMvpTerrain = Object.freeze({
  id: "synthetic-mvp-terrain",
  displayName: "Synthetic MVP Terrain",
  official: false,
  transcriptionStatus: "synthetic-local",
  nodes: Object.freeze([
    Object.freeze({ id: "blue-hq", kind: "hq", owner: "blue", label: "Blue HQ" }),
    Object.freeze({ id: "red-hq", kind: "hq", owner: "red", label: "Red HQ" }),
    Object.freeze({ id: "b1", kind: "base", label: "Blue Gate" }),
    Object.freeze({ id: "b2", kind: "base", label: "Medal East" }),
    Object.freeze({ id: "b3", kind: "base", label: "Medal West" }),
    Object.freeze({ id: "b4", kind: "base", label: "Red Gate" }),
  ]),
  edges: Object.freeze([
    Object.freeze({ id: "e-blue-b1", a: "blue-hq", b: "b1" }),
    Object.freeze({ id: "e-b1-b2", a: "b1", b: "b2" }),
    Object.freeze({ id: "e-b2-b3", a: "b2", b: "b3" }),
    Object.freeze({ id: "e-b3-b4", a: "b3", b: "b4" }),
    Object.freeze({ id: "e-b4-red", a: "b4", b: "red-hq" }),
  ]),
  regions: Object.freeze([
    Object.freeze({ id: "r-blue", boundaryBaseIds: Object.freeze(["b1", "b2"]), medalSpaceIds: Object.freeze(["m-blue"]) }),
    Object.freeze({ id: "r-red", boundaryBaseIds: Object.freeze(["b3", "b4"]), medalSpaceIds: Object.freeze(["m-red"]) }),
  ]),
  medalSpaces: Object.freeze([
    Object.freeze({ id: "m-blue", regionId: "r-blue", initialValue: 1 }),
    Object.freeze({ id: "m-red", regionId: "r-red", initialValue: 1 }),
  ]),
  objectives: Object.freeze({
    blue: Object.freeze({ requiredCount: 2, source: "syntheticLocalFixture" }),
    red: Object.freeze({ requiredCount: 2, source: "syntheticLocalFixture" }),
  }),
  setup: Object.freeze({
    hqByPlayer: Object.freeze({
      blue: Object.freeze(["blue-hq"]),
      red: Object.freeze(["red-hq"]),
    }),
  }),
  specialRules: Object.freeze([]),
  unresolvedDataNotes: Object.freeze([
    "Synthetic local fixture for engine MVP smoke checks only.",
    "Not an official Toy Battle board transcription.",
  ]),
});
