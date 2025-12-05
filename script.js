let board = [];
let gameOver = false;
let firstClick = true;
let isFlagMode = false;
let isMusicPlaying = false;

const SIZE = 20;
let flagsLeft;
let score = 0;

let time = 0;
let timer = null;

let boardElement = document.getElementById("minesweeper");
let flagsText = document.getElementById("flagsLeft");
let scoreText = document.getElementById("score");
let timeText = document.getElementById("time");
let statusText = document.getElementById("status");
let mobileToggleBtn = document.getElementById("mobileToggle");
let bgMusic = document.getElementById("bgMusic");
let musicToggle = document.getElementById("musicToggle");
let backBtn = document.getElementById("backBtn");

const MINES = Math.floor(SIZE * SIZE * 0.15);
flagsLeft = MINES;

let resetBtn = document.getElementById("reset");

if(boardElement) {
  boardElement.oncontextmenu = (e) => e.preventDefault();
}

if(resetBtn) resetBtn.onclick = startGame;

if(backBtn) {
  backBtn.onclick = function() {
    document.body.classList.add('fadeOut');
    
    if(bgMusic) {
      bgMusic.pause();
    }
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  };
}

if(musicToggle) {
  musicToggle.onclick = function() {
    if(isMusicPlaying) {
      bgMusic.pause();
      musicToggle.textContent = '🔇';
      isMusicPlaying = false;
    } else {
      if(bgMusic) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => console.log("Music play failed"));
      }
      musicToggle.textContent = '🔊';
      isMusicPlaying = true;
    }
  };
}

if(mobileToggleBtn) {
  mobileToggleBtn.onclick = toggleMode;
}

function toggleMode() {
  isFlagMode = !isFlagMode;
  updateMobileToggle();
}

function updateMobileToggle() {
  if(!mobileToggleBtn) return;
  
  if(isFlagMode) {
    mobileToggleBtn.classList.add('flagMode');
    mobileToggleBtn.innerHTML = '<img src="candycorn.png" alt="Flag Mode">';
  } else {
    mobileToggleBtn.classList.remove('flagMode');
    mobileToggleBtn.innerHTML = '';
  }
}

startGame();

function startGame() {
  board = [];
  gameOver = false;
  firstClick = true;
  score = 0;
  time = 0;
  flagsLeft = MINES;
  isFlagMode = false;

  if(flagsText) flagsText.textContent = flagsLeft;
  if(scoreText) scoreText.textContent = score;
  if(timeText) timeText.textContent = time;
  if(statusText) statusText.textContent = "";

  updateMobileToggle();

  if(timer) clearInterval(timer);
  
  for(let r = 0; r < SIZE; r++) {
    let row = [];
    for(let c = 0; c < SIZE; c++) {
      let el = document.createElement("div");
      el.className = "cell";
      el.dataset.status = "hidden";

            let tile = {
        element: el,
        x: r,
        y: c,
        mine: false,
        status: "hidden"
      };

      el.onmousedown = (e) => {
        if(window.innerWidth > 768) {
          handleClick(e, tile);
        }
      };
      
      el.onclick = (e) => {
        if(window.innerWidth <= 768) {
          handleMobileClick(e, tile);
        }
      };
      
      row.push(tile);
    }
    board.push(row);
  }

  drawBoard();
}

function handleClick(e, tile) {
  if(gameOver) return;

  if(firstClick && e.button === 0) {
    firstClick = false;
    placeMines(tile);
    
    timer = setInterval(() => {
      time++;
      if(timeText) timeText.textContent = time;
    }, 1000);
  }

  if(e.button === 0) open(tile);
  if(e.button === 2) flag(tile);
}

function handleMobileClick(e, tile) {
  if(gameOver) return;
  
  if(window.innerWidth <= 768) {
    e.preventDefault();
    
    if(firstClick) {
      firstClick = false;
      placeMines(tile);
      
      timer = setInterval(() => {
        time++;
        if(timeText) timeText.textContent = time;
      }, 1000);
    }
    
    if(isFlagMode) {
      flag(tile);
    } else {
      open(tile);
    }
  }
}

function placeMines(firstTile) {
  let safeZone = [firstTile];
  
  let neighbors = getNeighbors(firstTile);
  for(let n of neighbors) {
    safeZone.push(n);
  }

  let minesPlaced = 0;
  
  while(minesPlaced < MINES) {
    let x = Math.floor(Math.random() * SIZE);
    let y = Math.floor(Math.random() * SIZE);
    let tile = board[x][y];

    if(tile.mine) continue;

    let inSafeZone = false;
    for(let safe of safeZone) {
      if(safe.x === x && safe.y === y) {
        inSafeZone = true;
        break;
      }
    }

    if(!inSafeZone) {
      tile.mine = true;
      minesPlaced++;
    }
  }
}

function flag(tile) {
  if(tile.status !== "hidden" && tile.status !== "marked") return;

  if(tile.status === "marked") {
    tile.status = "hidden";
    flagsLeft++;
  } else {
    tile.status = "marked";
    flagsLeft--;
  }

  if(flagsText) flagsText.textContent = flagsLeft;
  drawBoard();
}

function open(tile) {
  if(tile.status !== "hidden") return;

  if(tile.mine) {
    tile.status = "mine";
    return endGame(false);
  }

  tile.status = "number";
  score += 10;
  if(scoreText) scoreText.textContent = score;

  let neighbors = getNeighbors(tile);
  let bombCount = 0;

  for(let n of neighbors) {
    if(n.mine) bombCount++;
  }

  if(bombCount === 0) {
    drawBoard();
    for(let n of neighbors) {
      open(n);
    }
  }

  drawBoard();
  checkWin();
}

function getNeighbors(tile) {
  let neighbors = [];

  for(let r = tile.x - 1; r <= tile.x + 1; r++) {
    for(let c = tile.y - 1; c <= tile.y + 1; c++) {
      if(r < 0 || c < 0 || r >= SIZE || c >= SIZE) continue;
      if(r === tile.x && c === tile.y) continue;
      neighbors.push(board[r][c]);
    }
  }
  
  return neighbors;
}

function drawBoard() {
  if(!boardElement) return;

  boardElement.innerHTML = "";

  for(let row of board) {
    for(let tile of row) {
      let el = tile.element;
      el.dataset.status = tile.status;
      el.innerHTML = "";

      if(tile.status === "mine") {
        el.innerHTML = `<img src="pumpkin.png">`;
      } 
      else if(tile.status === "marked") {
        el.innerHTML = `<img src="candycorn.png">`;
      } 
      else if(tile.status === "number") {
        let neighbors = getNeighbors(tile);
        let bombCount = 0;
        
        for(let n of neighbors) {
          if(n.mine) bombCount++;
        }

        if(bombCount > 0) {
          el.textContent = bombCount;
        }
      }

      boardElement.appendChild(el);
    }
  }
}

function checkWin() {
  let opened = 0;
  let safeTiles = SIZE * SIZE - MINES;

  for(let row of board) {
    for(let tile of row) {
      if(tile.status === "number") opened++;
    }
  }

  if(opened === safeTiles) endGame(true);
}

function endGame(win) {
  gameOver = true;
  clearInterval(timer);

  if(statusText) {
    statusText.textContent = win ? "YOU WIN!" : "GAME OVER.";
  }

  for(let row of board) {
    for(tile of row) {
      if(tile.mine) tile.status = "mine";
    }
  }

  drawBoard();
}


