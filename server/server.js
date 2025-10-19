import { WebSocketServer } from "ws";

// Start websocket
const wss = new WebSocketServer ({port: 8080})

let board = Array(25).fill(0);
let players = [];
let gameActive = true;

const LINES = [
  // rows
  [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
  // cols
  [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
  // diagonals
  [0,6,12,18,24],[4,8,12,16,20],
]

function checkWinnerAndLine() {
  for(const line of LINES) {
    const values = line.map(i=>board[i]);
    const addOdd = values.every(v=>v%2===1);
    const addEvenNonZero = values.every(v=>v !== 0 && v%2 === 0);
    if (addOdd) return {winner: 'ODD', winningLine: line}
    if (addEvenNonZero) return {winner: 'EVEN', winningLine: line} 
  }
  return null;
}

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const p of players) p?.readyState === 1 && p.send(data);
}

function resetGame() {
  board=Array(25).fill(0);
  gameActive = true;
}

wss.on('connection', (ws) => {
  // if >2 players
  if(players.length >= 2){
    ws.send(JSON.stringify({type: 'ERROR', message: 'Room full'}));
    ws.close();
    return;
  }

  players.push(ws);
  const role = players.length === 1 ? 'ODD' : 'EVEN';

  // Set role for current board
  ws.send(JSON.stringify({
    type: 'PLAYER_ASSIGNED',
    player: role,
    board,
  }));

  // game status
  if(players.length === 1){
    ws.send(JSON.stringify({type: 'WAITING', message: 'Waiting for opponent...'}));
  }
  if(players.length === 2){
    ws.send(JSON.stringify({type: 'START', message: 'Game Start!'}));
  }
  
  // Close WS
  ws.on('close',()=>{
    // if 1 player suddenly exits game --> over
    if(gameActive){
      broadcast({type:'GAME_OVER', winner: 'DISCONNECT', winningLine: null});
      gameActive = false;
    }

    players = players.filter(p=>p!==ws);

    //When nobody in game
    if(players.length===0){
      resetGame();
    } else if (players.length === 1){
      players[0].send(JSON.stringify({type: 'WAITING', message: 'Waiting for opponent...'}));
    }
  });
}
);

console.log('WS server at ws://localhost:8080');