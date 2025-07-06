const board = document.getElementById("topdown-board");
const message = document.getElementById("message");
const inventory = document.getElementById("inventory");
const undoCountEl = document.getElementById("undo-count");
const shuffleCountEl = document.getElementById("shuffle-count");
const undoButton = document.getElementById("undo-button");
const shuffleButton = document.getElementById("shuffle-button");

const TILE_SIZE = 60;
const OFFSET = 5;
const SYMBOLS = ['🍎', '🍌', '🍇', '🍓', '🥝', '🍍', '🥑', '🍒', '🍉', '🍅', '🥕', '🌽', '🥦', '🍠', '🥜'];

let allTiles = [];
let inventorySlots = [];
let undoStack = [];
let undoCount = 3;
let shuffleCount = 2;

function generateTurtleLayout() {
    const layout = [];

    // Die zentrale Pyramide (140 Karten)
    const layers = [
        { size: 7, offset: 0, z: 0 },
        { size: 6, offset: 0.5, z: 1 },
        { size: 5, offset: 1, z: 2 },
        { size: 4, offset: 1.5, z: 3 },
        { size: 3, offset: 2, z: 4 },
        { size: 2, offset: 2.5, z: 5 },
        { size: 1, offset: 3, z: 6 }
    ];

    for (const { size, offset, z } of layers) {
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                layout.push({
                    x: offset + x + OFFSET,
                    y: offset + y + OFFSET,
                    z
                });
            }
        }
    }

    // Feste Zusatzkarten (Rand) – 40 Stück
    const extras = [
        // „Arme“ vorne links
        { x: -1, y: -1 }, { x: -1, y: -2 }, { x: 0, y: -1 }, { x: 0, y: -2 },

        // „Arme“ vorne rechts
        { x: 6, y: -1 }, { x: 6, y: -2 }, { x: 7, y: -1 }, { x: 7, y: -2 },

        // „Beine“ hinten links
        { x: -1, y: 7 }, { x: -1, y: 8 }, { x: 0, y: 7 }, { x: 0, y: 8 },

        // „Beine“ hinten rechts
        { x: 6, y: 7 }, { x: 6, y: 8 }, { x: 7, y: 7 }, { x: 7, y: 8 },

        // Oben (Kopf)
        { x: 3, y: -1 }, { x: 2, y: -2 }, { x: 3, y: -2 }, { x: 4, y: -2 },
        { x: 2, y: -3 }, { x: 3, y: -3 }, { x: 4, y: -3 },
        { x: 2, y: -4 }, { x: 3, y: -4 }, { x: 4, y: -4 },

        // Links
        { x: -1, y: 1 }, { x: -1, y: 2 }, { x: -1, y: 3 }, { x: -1, y: 4 },
        { x: -1, y: 5 },

        // Rechts
        { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 },
        { x: 7, y: 5 },

        // Unten (Schwanz)
        { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 3, y: 8 }
    ];

    for (const { x, y } of extras) {
        layout.push({
            x: x + OFFSET,
            y: y + OFFSET,
            z: 0
        });
    }

    return layout;
}

function assignSymbols(layout) {
    const symbolPool = SYMBOLS.flatMap(s => Array(12).fill(s));
    shuffle(symbolPool);
    return layout.map((tile, i) => ({
        ...tile,
        symbol: symbolPool[i],
        id: i,
        removed: false
    }));
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function isTileFree(tile, all) {
    return !all.some(other =>
        !other.removed &&
        other.z > tile.z &&
        Math.abs(other.x - tile.x) < 1 &&
        Math.abs(other.y - tile.y) < 1
    );
}

function renderBoard() {
    board.innerHTML = "";
    for (const tile of allTiles) {
        if (tile.removed) continue;

        const div = document.createElement("div");
        div.className = "tile";
        div.style.left = `${tile.x * TILE_SIZE + tile.z * 4}px`;
        div.style.top = `${tile.y * TILE_SIZE - tile.z * 4}px`;
        div.style.zIndex = 100 + tile.z;
        div.textContent = tile.symbol;

        const free = isTileFree(tile, allTiles);
        if (!free) {
            div.classList.add("covered");
        } else {
            div.onclick = () => handleTileClick(tile);
        }

        board.appendChild(div);
    }
}

function renderInventory() {
    inventory.innerHTML = "";
    for (let i = 0; i < 7; i++) {
        const slot = document.createElement("div");
        slot.className = "slot";
        if (inventorySlots[i]) {
            slot.textContent = inventorySlots[i].symbol;
        }
        inventory.appendChild(slot);
    }
}

function handleTileClick(tile) {
    if (!isTileFree(tile, allTiles)) return;

    saveUndoState();
    tile.removed = true;
    inventorySlots.push(tile);
    const matched = checkInventoryMatch();
    renderAll();

    // Direkt prüfen: Wenn jetzt 7 Items im Regal und nichts entfernt wurde → Game Over
    if (inventorySlots.length >= 7 && !matched) {
        message.textContent = "Game Over – Inventory full!";
        disableButtons();
    }

    checkGameState();
}

function checkInventoryMatch() {
    const counts = {};
    for (const tile of inventorySlots) {
        if (!tile) continue;
        counts[tile.symbol] = (counts[tile.symbol] || 0) + 1;
    }

    let matched = false;
    for (const symbol in counts) {
        if (counts[symbol] >= 3) {
            inventorySlots = inventorySlots.filter(t => !(t && t.symbol === symbol));
            matched = true;
        }
    }

    return matched;
}

function checkGameState() {
    if (allTiles.every(t => t.removed) && inventorySlots.length === 0) {
        message.textContent = "You win!";
        disableButtons();
    }
}

function disableButtons() {
    undoButton.disabled = true;
    shuffleButton.disabled = true;
}

function saveUndoState() {
    if (undoCount <= 0) return;
    const copyTiles = allTiles.map(t => ({ ...t }));
    const copyInventory = [...inventorySlots];
    undoStack.push({ tiles: copyTiles, inventory: copyInventory });
    if (undoStack.length > 10) undoStack.shift(); // Optional begrenzen
}

function undoMove() {
    if (undoStack.length === 0 || undoCount <= 0) return;
    const last = undoStack.pop();
    allTiles = last.tiles.map(t => ({ ...t }));
    inventorySlots = [...last.inventory];
    undoCount--;
    undoCountEl.textContent = undoCount;
    renderAll();
    checkGameState();
}

function shuffleBoard() {
    if (shuffleCount <= 0) return;

    saveUndoState();

    const activeTiles = allTiles.filter(t => !t.removed);
    const symbols = activeTiles.map(t => t.symbol);
    shuffle(symbols);
    activeTiles.forEach((tile, i) => tile.symbol = symbols[i]);

    shuffleCount--;
    shuffleCountEl.textContent = shuffleCount;
    renderAll();
    checkGameState();
}

function renderAll() {
    renderBoard();
    renderInventory();
}

function restartGame() {
    const layout = generateTurtleLayout();
    allTiles = assignSymbols(layout);
    inventorySlots = [];
    undoStack = [];
    undoCount = 3;
    shuffleCount = 2;
    undoCountEl.textContent = undoCount;
    shuffleCountEl.textContent = shuffleCount;
    undoButton.disabled = false;
    shuffleButton.disabled = false;
    message.textContent = "";
    renderAll();
}

// Start
restartGame();
