import { COLS, PLAYER_NAMES, ROWS } from "./game.js";
import { getEasyMove, getHardMove } from "./ai.js";

const DROP_ANIMATION_MS = 260;

export class GameUI {
  constructor(game, elements) {
    this.game = game;
    this.boardEl = elements.boardEl;
    this.statusEl = elements.statusEl;
    this.statusChipEl = elements.statusChipEl;
    this.undoBtn = elements.undoBtn;
    this.resetBtn = elements.resetBtn;
    this.modeSelect = elements.modeSelect;
    this.cells = [];
    this.hoverCell = null;
    this.isAiThinking = false;
  }

  init() {
    this.buildBoard();
    this.bindEvents();
    this.render();
    this.checkAiTurn();
  }

  buildBoard() {
    this.boardEl.innerHTML = "";
    this.cells = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);

        const disc = document.createElement("div");
        disc.className = "disc";
        cell.appendChild(disc);

        this.boardEl.appendChild(cell);
        this.cells[row][col] = cell;
      }
    }
  }

  isAiTurn() {
    const mode = this.modeSelect.value;
    if (mode === "pvp") return false;
    return this.game.currentPlayer === 2;
  }

  checkAiTurn() {
    if (this.game.over || this.game.draw) return;
    if (this.isAiTurn() && !this.isAiThinking) {
      this.isAiThinking = true;
      setTimeout(() => {
        const mode = this.modeSelect.value;
        let col = -1;
        if (mode === "ai-easy") col = getEasyMove(this.game);
        else if (mode === "ai-hard") col = getHardMove(this.game);

        this.isAiThinking = false;
        if (col !== -1) {
          this.handleMove(col);
        }
      }, 400);
    }
  }

  bindEvents() {
    this.boardEl.addEventListener("click", (event) => {
      if (this.isAiTurn() || this.isAiThinking) return;
      const cell = event.target.closest(".cell");
      if (!cell) return;
      const col = Number(cell.dataset.col);
      this.handleMove(col);
    });

    this.boardEl.addEventListener("pointermove", (event) => {
      if (this.isAiTurn() || this.isAiThinking) {
        this.clearHover();
        return;
      }
      const cell = event.target.closest(".cell");
      if (!cell) return;
      const col = Number(cell.dataset.col);
      this.setHover(col);
    });

    this.boardEl.addEventListener("pointerleave", () => {
      this.clearHover();
    });

    this.resetBtn.addEventListener("click", () => {
      this.game.reset();
      this.clearHover();
      this.isAiThinking = false;
      this.render();
      this.checkAiTurn();
    });

    this.modeSelect.addEventListener("change", () => {
      this.game.reset();
      this.clearHover();
      this.isAiThinking = false;
      this.render();
      this.checkAiTurn();
    });

    this.undoBtn.addEventListener("click", () => {
      if (this.isAiTurn() || this.isAiThinking) return;
      const mode = this.modeSelect.value;
      const isVsAi = mode !== "pvp";

      const success = this.game.undo(isVsAi);
      if (success) {
        this.clearHover();
        this.render();
      }
    });
  }

  handleMove(col) {
    if (this.game.over) return;
    const result = this.game.applyMove(col);
    if (!result.valid) return;

    this.clearHover();
    this.render();
    this.animateDrop(result.row, result.col);

    this.checkAiTurn();
  }

  animateDrop(row, col) {
    const cell = this.cells[row][col];
    if (!cell) return;
    cell.classList.add("just-dropped");
    window.setTimeout(() => {
      cell.classList.remove("just-dropped");
    }, DROP_ANIMATION_MS);
  }

  setHover(col) {
    if (this.game.over) return;
    if (Number.isNaN(col)) return;

    const row = this.game.getAvailableRow(col);
    this.clearHover();

    if (row === -1) return;
    const cell = this.cells[row][col];
    if (!cell) return;
    cell.classList.add("hover");
    this.hoverCell = cell;
  }

  clearHover() {
    if (this.hoverCell) {
      this.hoverCell.classList.remove("hover");
      this.hoverCell = null;
    }
  }

  render() {
    const winningSet = new Set(
      this.game.winningCells.map((cell) => `${cell[0]}-${cell[1]}`)
    );

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cell = this.cells[row][col];
        const value = this.game.board[row][col];
        cell.classList.toggle("player-1", value === 1);
        cell.classList.toggle("player-2", value === 2);
        cell.classList.toggle("win", winningSet.has(`${row}-${col}`));
      }
    }

    this.boardEl.classList.toggle("is-over", this.game.over);

    if (this.game.winner) {
      this.statusEl.textContent = `Victoire: ${PLAYER_NAMES[this.game.winner]}`;
      this.statusChipEl.textContent = `Gagne: ${PLAYER_NAMES[this.game.winner]}`;
      this.statusChipEl.dataset.player = String(this.game.winner);
      delete this.statusChipEl.dataset.state;
    } else if (this.game.draw) {
      this.statusEl.textContent = "Match nul !";
      this.statusChipEl.textContent = "Grille pleine";
      delete this.statusChipEl.dataset.player;
      this.statusChipEl.dataset.state = "draw";
    } else {
      this.statusEl.textContent = `Tour de ${PLAYER_NAMES[this.game.currentPlayer]}`;
      this.statusChipEl.textContent = `Tour: ${PLAYER_NAMES[this.game.currentPlayer]}`;
      this.statusChipEl.dataset.player = String(this.game.currentPlayer);
      delete this.statusChipEl.dataset.state;
    }

    this.undoBtn.textContent = `Annuler (${this.game.remainingUndos})`;
    this.undoBtn.disabled = this.game.remainingUndos <= 0 || this.game.history.length === 0;
  }
}
