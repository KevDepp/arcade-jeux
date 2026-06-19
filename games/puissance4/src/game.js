export const ROWS = 6;
export const COLS = 7;
export const PLAYER_NAMES = {
  1: "Joueur 1",
  2: "Joueur 2",
};

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.currentPlayer = 1;
    this.over = false;
    this.winner = 0;
    this.draw = false;
    this.winningCells = [];
    this.moveCount = 0;

    // Feature: Undo history
    this.history = [];
    this.remainingUndos = 3;
  }

  getAvailableRow(col) {
    if (col < 0 || col >= COLS) return -1;
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (this.board[row][col] === 0) {
        return row;
      }
    }
    return -1;
  }

  isColumnFull(col) {
    return this.getAvailableRow(col) === -1;
  }

  applyMove(col) {
    if (this.over) {
      return { valid: false, reason: "game_over" };
    }

    const row = this.getAvailableRow(col);
    if (row === -1) {
      return { valid: false, reason: "column_full" };
    }

    const player = this.currentPlayer;

    // Save state before applying
    this.history.push({
      row, col, player,
      over: this.over, winner: this.winner, draw: this.draw,
      winningCells: [...this.winningCells]
    });

    this.board[row][col] = player;
    this.moveCount += 1;

    const winInfo = this.checkWin(row, col, player);
    if (winInfo.won) {
      this.over = true;
      this.winner = player;
      this.winningCells = winInfo.cells;
    } else if (this.moveCount === ROWS * COLS) {
      this.over = true;
      this.draw = true;
    } else {
      this.currentPlayer = player === 1 ? 2 : 1;
    }

    return {
      valid: true,
      row,
      col,
      player,
      over: this.over,
      winner: this.winner,
      draw: this.draw,
      winningCells: this.winningCells,
    };
  }

  undo(isVsAi) {
    if (this.remainingUndos <= 0 || this.history.length === 0) return false;

    if (isVsAi) {
      // In vs AI mode, undoing needs to revert two moves (the AI's and the Player's)
      // to bring it back to the Player's turn. 
      // If history only has 1 move, we just revert 1 (the player's first move before AI answered).
      let stepsToUndo = this.history.length >= 2 ? 2 : 1;

      let stateToRestore = null;
      for (let i = 0; i < stepsToUndo; i++) {
        stateToRestore = this.history.pop();
        this.board[stateToRestore.row][stateToRestore.col] = 0;
        this.moveCount -= 1;
      }

      this.over = stateToRestore.over;
      this.winner = stateToRestore.winner;
      this.draw = stateToRestore.draw;
      this.winningCells = stateToRestore.winningCells;
      this.currentPlayer = stateToRestore.player;

    } else {
      // PvP mode: revert exactly one move
      let lastMove = this.history.pop();
      this.board[lastMove.row][lastMove.col] = 0;
      this.moveCount -= 1;

      this.over = lastMove.over;
      this.winner = lastMove.winner;
      this.draw = lastMove.draw;
      this.winningCells = lastMove.winningCells;
      this.currentPlayer = lastMove.player;
    }

    this.remainingUndos -= 1;
    return true;
  }

  checkWin(row, col, player) {
    for (const [dr, dc] of DIRECTIONS) {
      const cells = this.collectLine(row, col, dr, dc, player);
      if (cells.length >= 4) {
        const index = cells.findIndex((cell) => cell[0] === row && cell[1] === col);
        const start = Math.min(Math.max(index - 3, 0), cells.length - 4);
        return { won: true, cells: cells.slice(start, start + 4) };
      }
    }
    return { won: false, cells: [] };
  }

  collectLine(row, col, dr, dc, player) {
    const cells = [[row, col]];
    for (const direction of [-1, 1]) {
      let r = row + dr * direction;
      let c = col + dc * direction;
      while (this.isInside(r, c) && this.board[r][c] === player) {
        if (direction === -1) {
          cells.unshift([r, c]);
        } else {
          cells.push([r, c]);
        }
        r += dr * direction;
        c += dc * direction;
      }
    }
    return cells;
  }

  isInside(row, col) {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
  }

  clone() {
    const newGame = new Game();
    newGame.board = this.board.map((row) => [...row]);
    newGame.currentPlayer = this.currentPlayer;
    newGame.over = this.over;
    newGame.winner = this.winner;
    newGame.draw = this.draw;
    newGame.winningCells = [...this.winningCells];
    newGame.moveCount = this.moveCount;
    return newGame;
  }
}
