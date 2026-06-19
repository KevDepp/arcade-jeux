import { getOfficialTerrain } from "../engine/terrains.js";

export const syntheticMvpLayout = Object.freeze({
  "blue-hq": Object.freeze({ x: 8, y: 50 }),
  b1: Object.freeze({ x: 24, y: 50 }),
  b2: Object.freeze({ x: 40, y: 34 }),
  b3: Object.freeze({ x: 60, y: 66 }),
  b4: Object.freeze({ x: 76, y: 50 }),
  "red-hq": Object.freeze({ x: 92, y: 50 }),
});

function normalizeCoordinate(value, max, insetPercent = 0) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 50;
  return Math.max(insetPercent, Math.min(100 - insetPercent, (value / max) * 100));
}

function layoutFromTerrainCoordinates(terrain) {
  const width = terrain.coordinateSystem?.width ?? 100;
  const height = terrain.coordinateSystem?.height ?? 100;
  return Object.freeze(Object.fromEntries((terrain.nodes ?? []).map((node) => [
    node.id,
    Object.freeze({
      x: normalizeCoordinate(node.x, width, 3),
      y: normalizeCoordinate(node.y, height, 3),
    }),
  ])));
}

export const cemeteryLayout = layoutFromTerrainCoordinates(getOfficialTerrain("le-cimetiere-maudit"));

function normalizeRoutePoint(terrain, point) {
  const width = terrain.coordinateSystem?.width ?? 100;
  const height = terrain.coordinateSystem?.height ?? 100;
  return Object.freeze({
    x: normalizeCoordinate(point.x, width),
    y: normalizeCoordinate(point.y, height),
  });
}

export function routePointsForEdge(terrain, layout, edge) {
  return Object.freeze([
    layout[edge.a] ?? Object.freeze({ x: 50, y: 50 }),
    ...(edge.via ?? []).map((point) => normalizeRoutePoint(terrain, point)),
    layout[edge.b] ?? Object.freeze({ x: 50, y: 50 }),
  ]);
}

const customLayouts = {};

export function registerCustomTerrainLayout(terrain) {
  customLayouts[terrain.id] = layoutFromTerrainCoordinates(terrain);
}

export function layoutForTerrain(terrainId) {
  if (terrainId === "synthetic-mvp-terrain") return syntheticMvpLayout;
  if (terrainId === "le-cimetiere-maudit") return cemeteryLayout;
  if (customLayouts[terrainId]) return customLayouts[terrainId];
  return syntheticMvpLayout;
}

export function isDenseTerrainLayout(terrainId) {
  return terrainId === "le-cimetiere-maudit" || terrainId.startsWith("custom-");
}
