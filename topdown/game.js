const board = document.getElementById("topdown-board");
const message = document.getElementById("message");

const cols = 8;
const rows = 6;
const tileSize = 60;

function initTopDown() {
    board.innerHTML = "";
    board.style.position = "relative";
    board.style.width = `${cols * tileSize}px`;
    board.style.height = `${rows * tileSize}px`;

    const symbols = ["🍎", "🍌", "🍇", "🍓", "🥝"];
    const tiles = [];

    for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        const layer = Math.floor(Math.random() * 3);
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];

        tiles.push({ x, y, layer, symbol });
    }

    tiles.sort((a, b) => a.layer - b.layer);

    for (let tile of tiles) {
        const div = document.createElement("div");
        div.className = "tile";
        div.style.left = `${tile.x * tileSize}px`;
        div.style.top = `${tile.y * tileSize}px`;
        div.style.zIndex = 100 + tile.layer;
        div.textContent = tile.symbol;
        board.appendChild(div);
    }

    message.textContent = "Prototype: Clickable logic not implemented yet.";
}

initTopDown();
