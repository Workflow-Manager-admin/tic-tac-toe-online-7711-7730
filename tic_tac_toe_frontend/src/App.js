import React, { useState, useEffect } from "react";
import "./App.css";

// --- Theme Colors based on request ---
const COLORS = {
  accent: "#ff9800",
  primary: "#1976d2",
  secondary: "#424242",
  textLight: "#282c34",
  textDark: "#ffffff",
};

const MODES = {
  SINGLE: "1P (vs Computer)",
  TWO: "2P (local)",
};

// --- Game Logic Utilities ---
// PUBLIC_INTERFACE
function getInitialBoard() {
  // Return fresh 3x3 Tic Tac Toe board
  return Array(9).fill(null);
}

// PUBLIC_INTERFACE
function checkWinner(board) {
  /**Returns "X", "O", "draw", or null depending on current board state.*/
  const lines = [
    [0, 1, 2], // rows
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6], // columns
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8], // diagonals
    [2, 4, 6],
  ];
  for (let arr of lines) {
    const [a, b, c] = arr;
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }
  // Draw if board is full but no winner
  if (board.every((cell) => cell)) {
    return "draw";
  }
  return null;
}

// PUBLIC_INTERFACE
function getAvailableMoves(board) {
  /**Returns array of indices with empty cells.*/
  return board.map((cell, idx) => (cell === null ? idx : null)).filter((idx) => idx !== null);
}

// --- Simple AI ---
// PUBLIC_INTERFACE
function computerMove(board, aiMark = "O", humanMark = "X") {
  /**
   * Returns the AI's next move.
   * - If AI can win, it takes the spot
   * - If human can win, block it
   * - Otherwise pick center, corners, or random
   */
  // 1. Win if possible
  for (let idx of getAvailableMoves(board)) {
    const copy = [...board];
    copy[idx] = aiMark;
    if (checkWinner(copy) === aiMark) {
      return idx;
    }
  }
  // 2. Block if opponent can win
  for (let idx of getAvailableMoves(board)) {
    const copy = [...board];
    copy[idx] = humanMark;
    if (checkWinner(copy) === humanMark) {
      return idx;
    }
  }
  // 3. Take center if available
  if (board[4] == null) return 4;
  // 4. Take a random corner if possible
  const corners = [0, 2, 6, 8].filter((i) => board[i] == null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }
  // 5. Take any random move
  const available = getAvailableMoves(board);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// --- Board Component ---
function Board({ board, onClick, gameOver, accentColor }) {
  // Render 3x3 grid, and pass onClick with cell index
  return (
    <div className="ttt-board" style={{ borderColor: accentColor }}>
      {board.map((cell, idx) => (
        <button
          className="ttt-cell"
          key={idx}
          style={{
            color: cell === "X" ? COLORS.primary : COLORS.secondary,
            borderColor: accentColor,
          }}
          onClick={() => onClick(idx)}
          disabled={cell || gameOver}
          aria-label={`cell-${idx}`}
        >
          {cell}
        </button>
      ))}
    </div>
  );
}

// --- Control Panel ---
function ControlPanel({
  mode,
  setMode,
  isXTurn,
  winner,
  onRestart,
  accentColor,
  currentPlayer,
  showTurn,
  canSwitchMode,
}) {
  // Announcements and control buttons
  let message = "";
  if (winner === "draw") {
    message = "It's a Draw! 😮";
  } else if (winner) {
    message = `Winner: ${winner} 🎉`;
  } else if (showTurn) {
    message = `Turn: ${currentPlayer}`;
  }
  return (
    <div className="ttt-panel" style={{ borderColor: accentColor }}>
      <div className="ttt-panel-row">
        <label htmlFor="mode" style={{ marginRight: 12 }}>
          Mode:
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={!canSwitchMode}
          style={{
            background: COLORS.secondary + "10",
            color: COLORS.textLight,
            border: `1px solid ${accentColor}`,
            borderRadius: 6,
            padding: "4px 8px",
            fontWeight: 500,
          }}
        >
          <option value={MODES.SINGLE}>{MODES.SINGLE}</option>
          <option value={MODES.TWO}>{MODES.TWO}</option>
        </select>
      </div>
      <div
        className="ttt-panel-row ttt-announcement"
        style={{ color: accentColor }}
      >
        {message}
      </div>
      <div className="ttt-panel-row">
        <button className="ttt-btn" onClick={onRestart}>Restart</button>
      </div>
    </div>
  );
}

// --- Main App ---
// PUBLIC_INTERFACE
function App() {
  const [mode, setMode] = useState(MODES.SINGLE); // Game mode
  const [board, setBoard] = useState(getInitialBoard());
  const [isXTurn, setIsXTurn] = useState(true); // X always starts
  const [winner, setWinner] = useState(null); // "X", "O", "draw", or null
  const [gameActive, setGameActive] = useState(true);

  // On mode change, reset
  useEffect(() => {
    handleRestart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Compute winner on every board change
  useEffect(() => {
    const res = checkWinner(board);
    setWinner(res);
    setGameActive(res === null);

    // AI Move if single player and it's O's turn, game still open
    if (
      mode === MODES.SINGLE &&
      !isXTurn &&
      res === null
    ) {
      // Delay AI move for minimal realism
      const aiTimeout = setTimeout(() => {
        const idx = computerMove(board, "O", "X");
        if (idx != null && board[idx] == null) {
          makeMove(idx);
        }
      }, 400);
      return () => clearTimeout(aiTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isXTurn, mode]);

  // PUBLIC_INTERFACE
  function makeMove(idx) {
    if (!gameActive || board[idx]) return;
    const next = [...board];
    next[idx] = isXTurn ? "X" : "O";
    setBoard(next);
    setIsXTurn((prev) => !prev);
  }

  // PUBLIC_INTERFACE
  function handleCellClick(idx) {
    // In single player, human always "X", can move only when isXTurn
    if (mode === MODES.SINGLE) {
      if (!isXTurn || board[idx] != null) return;
      makeMove(idx);
    } else {
      // 2P: Alternate turns
      if (board[idx] != null) return;
      makeMove(idx);
    }
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    setBoard(getInitialBoard());
    setIsXTurn(true);
    setWinner(null);
    setGameActive(true);
  }

  const showTurn = !winner;
  const currentPlayer =
    mode === MODES.SINGLE
      ? isXTurn
        ? "You (X)"
        : "Computer (O)"
      : isXTurn
      ? "Player X"
      : "Player O";

  // Basic theme (light only as per requirements)
  useEffect(() => {
    document.body.style.background = "#fbfbfb";
    document.body.style.color = COLORS.textLight;
  }, []);

  return (
    <div className="ttt-outer">
      <h1 className="ttt-title" style={{ color: COLORS.primary }}>
        Tic Tac Toe
      </h1>
      <div className="ttt-center-wrap">
        <Board
          board={board}
          onClick={handleCellClick}
          gameOver={!!winner}
          accentColor={COLORS.accent}
        />
        <ControlPanel
          mode={mode}
          setMode={setMode}
          isXTurn={isXTurn}
          winner={winner}
          onRestart={handleRestart}
          accentColor={COLORS.accent}
          currentPlayer={currentPlayer}
          showTurn={showTurn}
          canSwitchMode={board.every((cell) => cell == null) || !!winner}
        />
      </div>
      <footer className="ttt-footer">
        <span>
          <span style={{ color: COLORS.accent }}>Tic Tac Toe</span> &copy; {new Date().getFullYear()} &ndash; Minimal React Implementation
        </span>
      </footer>
    </div>
  );
}

export default App;
