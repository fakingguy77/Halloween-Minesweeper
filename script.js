const SIZE = 20;
const MINES = Math.floor(SIZE * SIZE * 0.15);

let board = [];
let flagsLeft = MINES;
let score = 0;
let time = 0;

let gameOver = false;
let firstClick = true;
let isFlagMode = false;

let timer = null;

const boardElement = document.getElementById("minesweeper");
const flagsText = document.getElementById("flagsLeft");
const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const statusText = document.getElementById("status");
const mobileToggleBtn = document.getElementById("mobileToggle");
const bgMusic = document.getElementById("bgMusic");
const resetBtn = document.getElementById("reset");

if (boardElement) {
  boardElement.oncontextmenu = e => e.preventDefault();
}

if (resetBtn) {
  resetBtn.onclick = startGame;
}

window.addEventListener("load", () => {
  if (bgMusic) {
    bgMusic.volume = 0.3;
    bgMusic.play().catch(() => console.log("Music autoplay blocked"));
  }
});

function goBack() {
  document.body.classList.add("fadeOut");

  if (bgMusic) bgMusic.pause();

  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);

function toggleMode() {
  isFlagMode = !isFlagMode;
  updateMobileToggle();
}

function updateMobileToggle() {
  if (!mobileToggleBtn) return;

  if (isFlagMode) {
    mobileToggleBtn.classList.add("flagMode");
    mobileToggleBtn.innerHTML = `<img src="candycorn.png" alt="Flag Mode">`;
  } else {
    mobileToggleBtn.classList.remove("flagMode");
    mobileToggleBtn.innerHTML = "";
  }
}

function startGame() {
  board = [];
  flagsLeft = MINES;
  score = 0;
  time = 0;
  gameOver = false;
  firstClick = true;
  isFlagMode = false;

  updateUI();
  updateMobileToggle();

  if (timer) clearInterval(timer);

  for (let r = 0; r < SIZE; r++) {
    const row = [];

    for (let c = 0; c < SIZE; c++) {
      const el = document.createElement("div");
      el.className = "cell";
      el.dataset.status = "hidden";

      const tile = {
        element: el,
        x: r,
        y: c,
        mine: false,
        status: "hidden",
      };

      el.onmousedown = e => handleClick(e, tile);
      el.onclick = e => handleMobileClick(e, tile);

      row.push(tile);
    }

    board.push(row);
  }

  drawBoard();
}

function updateUI() {
  flagsText.textContent = flagsLeft;
  scoreText.textContent = score;
  timeText.textContent = time;
  statusText.textContent = "";
}

function handleClick(e, tile) {
  if (gameOver) return;

  if (firstClick && e.button === 0) {
    firstClick = false;
    initializeMines(tile);
    startTimer();
  }

  if (e.button === 0) open(tile);
  if (e.button === 2) flag(tile);
}

function handleMobileClick(e, tile) {
  if (gameOver) return;
  if (window.innerWidth > 768) return;

  e.preventDefault();

  if (firstClick) {
    firstClick = false;
    initializeMines(tile);
    startTimer();
  }

  isFlagMode ? flag(tile) : open(tile);
}

function startTimer() {
  timer = setInterval(() => {
    time++;
    timeText.textContent = time;
  }, 1000);
}

function initializeMines(firstTile) {
  const safeZone = [firstTile, ...getNeighbors(firstTile)];
  let minesPlaced = 0;

  while (minesPlaced < MINES) {
    const x = Math.floor(Math.random() * SIZE);
    const y = Math.floor(Math.random() * SIZE);
    const tile = board[x][y];

    if (tile.mine || safeZone.includes(tile)) continue;

    tile.mine = true;
    minesPlaced++;
  }
}
  
function flag(tile) {
  if (!["hidden", "marked"].includes(tile.status)) return;

  if (tile.status === "marked") {
    tile.status = "hidden";
    flagsLeft++;
  } else {
    tile.status = "marked";
    flagsLeft--;
  }

  flagsText.textContent = flagsLeft;
  drawBoard();
}

function open(tile) {
  if (tile.status !== "hidden") return;

  if (tile.mine) {
    tile.status = "mine";
    return endGame(false);
  }

  tile.status = "number";
  score += 10;
  scoreText.textContent = score;

  const neighbors = getNeighbors(tile);
  const bombCount = neighbors.filter(t => t.mine).length;

  if (bombCount === 0) {
    drawBoard();
    neighbors.forEach(n => open(n));
  }

  drawBoard();
  checkWin();
}

function getNeighbors(tile) {
  const neighbors = [];

  for (let r = tile.x - 1; r <= tile.x + 1; r++) {
    for (let c = tile.y - 1; c <= tile.y + 1; c++) {
      if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) continue;
      if (r === tile.x && c === tile.y) continue;
      neighbors.push(board[r][c]);
    }
  }

  return neighbors;
}

function drawBoard() {
  if (!boardElement) return;

  boardElement.innerHTML = "";

  for (const row of board) {
    for (const tile of row) {
      const el = tile.element;
      el.dataset.status = tile.status;
      el.innerHTML = "";

      if (tile.status === "mine") {
        el.innerHTML = `<img src="pumpkin.png">`;
      } else if (tile.status === "marked") {
        el.innerHTML = `<img src="candycorn.png">`;
      } else if (tile.status === "number") {
        const bombCount = getNeighbors(tile).filter(t => t.mine).length;
        if (bombCount > 0) el.textContent = bombCount;
      }

      boardElement.appendChild(el);
    }
  }
}

function checkWin() {
  const openedTiles = board.flat().filter(t => t.status === "number").length;
  const safeTiles = SIZE * SIZE - MINES;

  if (openedTiles === safeTiles) endGame(true);
}

function endGame(win) {
  gameOver = true;
  clearInterval(timer);

  statusText.textContent = win ? "YOU WIN!" : "GAME OVER.";

  board.flat().forEach(tile => {
    if (tile.mine) tile.status = "mine";
  });

  drawBoard();
}
