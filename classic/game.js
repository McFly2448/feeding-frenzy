
// Feeding Frenzy – Classic Game
const symbolPool = ["🍎", "🍌", "🍇", "🍉", "🍓", "🥝", "🍍", "🍑", "🥥", "🍒", 
                    "🍅", "🥕", "🌽", "🥦", "🍠", "🥜", "🍆", "🫐", "🍕", "🍔", 
                    "🍟", "🌭", "🍿", "🥓"];
const board = document.getElementById("game-board");
const inventory = document.getElementById("inventory");
const message = document.getElementById("message");

const cols = 9;
const rows = 8;
const maxInventory = 7;
const maxUndos = 3;
const maxShuffles = 2;

let stackMap = [];
let inventoryList = [];
let undoHistory = [];
let usedUndos = 0;
let usedShuffles = 0;
let gameOver = false;

function initGame() {
  stackMap = [];
  inventoryList = [];
  undoHistory = [];
  usedUndos = 0;
  usedShuffles = 0;
  gameOver = false;
  board.innerHTML = "";
  inventory.innerHTML = "";
  message.textContent = "";
  document.getElementById("undo-count").textContent = maxUndos;
  document.getElementById("shuffle-count").textContent = maxShuffles;

  const totalTiles = cols * rows;
  const allTiles = getSymbolsForDifficulty(totalTiles);

  for (let x = 0; x < cols; x++) {
    stackMap[x] = [];
  }

  let tileIndex = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (tileIndex < allTiles.length) {
        stackMap[x].push(allTiles[tileIndex]);
        tileIndex++;
      }
    }
  }

  renderBoard();
  renderInventory();
  updateButtons();
}

function getSymbolsForDifficulty(totalTiles) {
  const difficulty = document.getElementById("difficulty")?.value || "normal";
  let symbols = [];
  switch (difficulty) {
    case "easy":
      symbols = symbolPool.slice(0, 6); break;
    case "hard":
      symbols = symbolPool.slice(0, 12); break;
    case "very-hard":
      symbols = symbolPool.slice(0, 18); break;
    case "impossible":
      symbols = symbolPool.slice(0, 24); break;
    case "normal":
    default:
      symbols = symbolPool.slice(0, 9); break;
  }

  const allTiles = [];
  let i = 0;
  while (allTiles.length + 3 <= totalTiles) {
    const s = symbols[i % symbols.length];
    allTiles.push(s, s, s);
    i++;
  }

  shuffleArray(allTiles);
  return allTiles;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function renderBoard() {
  board.innerHTML = "";
  const maxHeight = Math.max(...stackMap.map(s => s.length));
  for (let y = maxHeight - 1; y >= 0; y--) {
    for (let x = 0; x < cols; x++) {
      const stack = stackMap[x];
      const symbol = stack[y];
      const tile = document.createElement("div");
      tile.classList.add("tile");
      if (symbol) {
        tile.textContent = symbol;
        if (y < stack.length - 1) {
          tile.classList.add("covered");
        } else {
          tile.addEventListener("click", () => pickTile(x));
        }
      }
      board.appendChild(tile);
    }
  }
}

function renderInventory() {
  inventory.innerHTML = "";
  for (let i = 0; i < maxInventory; i++) {
    const slot = document.createElement("div");
    slot.classList.add("slot");
    slot.textContent = inventoryList[i] || "";
    inventory.appendChild(slot);
  }
}

function pickTile(x) {
  if (gameOver) return;
  const stack = stackMap[x];
  if (!stack || stack.length === 0) return;

  const symbol = stack.pop();
  undoHistory.push({ column: x, symbol: symbol, inventorySnapshot: [...inventoryList] });
  inventoryList.push(symbol);

  const before = inventoryList.length;
  checkMatches();
  const after = inventoryList.length;

  if (before === maxInventory && after === maxInventory) {
    message.textContent = "💀 Game Over! Shelf is full.";
    gameOver = true;
    updateButtons();
    renderBoard();
    renderInventory();
    return;
  }

  if (inventoryList.length > maxInventory) {
    inventoryList.pop();
    stack.push(symbol);
    undoHistory.pop();
    message.textContent = "❌ Shelf limit reached!";
    return;
  }

  renderBoard();
  renderInventory();
  checkWinCondition();
  updateButtons();
}

function checkMatches() {
  const counts = {};
  for (let s of inventoryList) {
    counts[s] = (counts[s] || 0) + 1;
  }

  for (let s in counts) {
    if (counts[s] >= 3) {
      inventoryList = inventoryList.filter(e => e !== s);
      message.textContent = `✅ Removed 3x ${s}`;
    }
  }
}

function checkWinCondition() {
  const allEmpty = stackMap.every(col => col.length === 0);
  if (allEmpty && inventoryList.length === 0) {
    message.textContent = "🎉 You win! The board is clear.";
    gameOver = true;
    updateButtons();
  }
}

function undoMove() {
  if (gameOver || usedUndos >= maxUndos || undoHistory.length === 0) {
    message.textContent = "⛔ Undo not possible!";
    return;
  }

  const last = undoHistory.pop();
  if (!last) return;

  inventoryList = [...last.inventorySnapshot];
  stackMap[last.column].push(last.symbol);
  usedUndos++;
  document.getElementById("undo-count").textContent = maxUndos - usedUndos;
  message.textContent = "↩️ Move undone";
  renderBoard();
  renderInventory();
  updateButtons();
}

function shuffleBoard() {
  if (gameOver || usedShuffles >= maxShuffles) {
    message.textContent = "⛔ Shuffle not possible!";
    return;
  }

  const allRemaining = [];
  for (let col of stackMap) {
    while (col.length > 0) {
      allRemaining.push(col.pop());
    }
  }

  shuffleArray(allRemaining);
  let index = 0;
  for (let x = 0; x < cols; x++) {
    stackMap[x] = [];
  }
  for (let i = 0; i < allRemaining.length; i++) {
    stackMap[i % cols].push(allRemaining[i]);
  }

  usedShuffles++;
  document.getElementById("shuffle-count").textContent = maxShuffles - usedShuffles;
  message.textContent = "🔀 Board shuffled!";
  renderBoard();
  updateButtons();
}

function updateButtons() {
  document.querySelector("button[onclick='undoMove()']").disabled =
    gameOver || undoHistory.length === 0 || usedUndos >= maxUndos;

  document.querySelector("button[onclick='shuffleBoard()']").disabled =
    gameOver || usedShuffles >= maxShuffles;
}

function toggleZoom() {
  const zoomed = document.body.classList.toggle("zoomed");
  localStorage.setItem("zoom", zoomed ? "true" : "false");

  const btn = document.getElementById("zoom-button");
  if (btn) {
    btn.textContent = zoomed ? "🔎 Zoom Out" : "🔍 Zoom In";
  }

  renderBoard();
}

function applyZoomSetting() {
  const stored = localStorage.getItem("zoom");
  if (stored === "true") {
    document.body.classList.add("zoomed");
  }

  const btn = document.getElementById("zoom-button");
  if (btn) {
    btn.textContent = document.body.classList.contains("zoomed") ? "🔎 Zoom Out" : "🔍 Zoom In";
  }

  renderBoard();
}

initGame();
applyZoomSetting();
