import { Game } from "./game.js";
import { GameUI } from "./ui.js";

const game = new Game();

const ui = new GameUI(game, {
  boardEl: document.getElementById("board"),
  statusEl: document.getElementById("status"),
  statusChipEl: document.getElementById("statusChip"),
  undoBtn: document.getElementById("undoBtn"),
  resetBtn: document.getElementById("resetBtn"),
  modeSelect: document.getElementById("modeSelect"),
});

ui.init();
