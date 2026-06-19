import { COLS, ROWS } from "./game.js";

function getValidMoves(game) {
    const moves = [];
    for (let c = 0; c < COLS; c++) {
        if (!game.isColumnFull(c)) moves.push(c);
    }
    return moves;
}

export function getEasyMove(game) {
    const aiPlayer = game.currentPlayer;
    const oppPlayer = aiPlayer === 1 ? 2 : 1;
    const validMoves = getValidMoves(game);

    if (validMoves.length === 0) return -1;

    // 1. Can AI win immediately?
    for (const matchCol of validMoves) {
        const sim = game.clone();
        sim.applyMove(matchCol);
        if (sim.winner === aiPlayer) return matchCol;
    }

    // 2. Can Opponent win immediately? (Block)
    for (const matchCol of validMoves) {
        const sim = game.clone();
        // Simulate opponent's turn
        sim.currentPlayer = oppPlayer;
        sim.applyMove(matchCol);
        if (sim.winner === oppPlayer) return matchCol;
    }

    // 3. Otherwise random valid move
    return validMoves[Math.floor(Math.random() * validMoves.length)];
}

// ---------------- Hard Move (Minimax + Alpha Beta) ----------------

const MAX_DEPTH = 6;

function evaluateBoard(game, aiPlayer) {
    let score = 0;
    const oppPlayer = aiPlayer === 1 ? 2 : 1;

    // Evaluate center column preference
    const CENTER_COL = Math.floor(COLS / 2);
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
        if (game.board[r][CENTER_COL] === aiPlayer) centerCount++;
        else if (game.board[r][CENTER_COL] === oppPlayer) centerCount--;
    }
    score += centerCount * 3;

    function scoreWindow(window) {
        let aiCount = 0;
        let oppCount = 0;
        for (const cell of window) {
            if (cell === aiPlayer) aiCount++;
            else if (cell === oppPlayer) oppCount++;
        }

        if (aiCount === 4) return 10000;
        if (aiCount === 3 && oppCount === 0) return 5;
        if (aiCount === 2 && oppCount === 0) return 2;
        if (oppCount === 3 && aiCount === 0) return -80; // block is highly valued
        return 0;
    }

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [
                game.board[r][c],
                game.board[r][c + 1],
                game.board[r][c + 2],
                game.board[r][c + 3]
            ];
            score += scoreWindow(window);
        }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            const window = [
                game.board[r][c],
                game.board[r + 1][c],
                game.board[r + 2][c],
                game.board[r + 3][c]
            ];
            score += scoreWindow(window);
        }
    }

    // Diagonal 1 (\)
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [
                game.board[r][c],
                game.board[r + 1][c + 1],
                game.board[r + 2][c + 2],
                game.board[r + 3][c + 3]
            ];
            score += scoreWindow(window);
        }
    }

    // Diagonal 2 (/)
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const window = [
                game.board[r + 3][c],
                game.board[r + 2][c + 1],
                game.board[r + 1][c + 2],
                game.board[r][c + 3]
            ];
            score += scoreWindow(window);
        }
    }

    return score;
}

function minimax(game, depth, alpha, beta, isMaximizing, aiPlayer) {
    const oppPlayer = aiPlayer === 1 ? 2 : 1;
    const validMoves = getValidMoves(game);

    // Terminal conditions
    if (game.over) {
        if (game.winner === aiPlayer) return { score: 10000000 + depth };
        if (game.winner === oppPlayer) return { score: -10000000 - depth };
        if (game.draw) return { score: 0 };
    }
    if (depth === 0 || validMoves.length === 0) {
        return { score: evaluateBoard(game, aiPlayer) };
    }

    // Move ordering: put center columns first to prune faster
    const centerOrder = [3, 2, 4, 1, 5, 0, 6];
    validMoves.sort((a, b) => centerOrder.indexOf(a) - centerOrder.indexOf(b));

    let bestMove = validMoves[0];

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const col of validMoves) {
            const sim = game.clone();
            sim.applyMove(col);
            const evaluation = minimax(sim, depth - 1, alpha, beta, false, aiPlayer).score;
            if (evaluation > maxEval) {
                maxEval = evaluation;
                bestMove = col;
            }
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const col of validMoves) {
            const sim = game.clone();
            sim.applyMove(col);
            const evaluation = minimax(sim, depth - 1, alpha, beta, true, aiPlayer).score;
            if (evaluation < minEval) {
                minEval = evaluation;
                bestMove = col;
            }
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return { score: minEval, move: bestMove };
    }
}

export function getHardMove(game) {
    if (game.moveCount === 0 || game.moveCount === 1) {
        if (!game.isColumnFull(3)) return 3;
    }

    const aiPlayer = game.currentPlayer;
    const result = minimax(game, MAX_DEPTH, -Infinity, Infinity, true, aiPlayer);
    return result.move ?? getValidMoves(game)[0];
}
