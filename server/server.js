// server.js - WebSocket Server for Odd/Even Tic-Tac-Toe
const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

// Game state
let gameState = {
  board: Array(25).fill(0),
  players: {
    odd: null,
    even: null
  },
  gameOver: false,
  winner: null
};

// Win lines
const WIN_LINES = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20]
];

function checkWinCondition() {
  for (const line of WIN_LINES) {
    const values = line.map(i => gameState.board[i]);
    
    // Check all odd (and not zero)
    if (values.every(v => v % 2 === 1 && v > 0)) {
      return { winner: 'ODD', line };
    }
    
    // Check all even (and not zero)
    if (values.every(v => v % 2 === 0 && v > 0)) {
      return { winner: 'EVEN', line };
    }
  }
  
  return null;
}

function broadcast(message, excludeClient = null) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

function resetGame() {
  gameState = {
    board: Array(25).fill(0),
    players: gameState.players, // Keep players
    gameOver: false,
    winner: null
  };
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Assign player
  let assignedPlayer = null;
  if (!gameState.players.odd) {
    assignedPlayer = 'ODD';
    gameState.players.odd = ws;
    ws.playerType = 'ODD';
  } else if (!gameState.players.even) {
    assignedPlayer = 'EVEN';
    gameState.players.even = ws;
    ws.playerType = 'EVEN';
  } else {
    // Third player - reject
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Game is full. Only 2 players allowed.'
    }));
    ws.close();
    return;
  }
  
  // Send player assignment
  ws.send(JSON.stringify({
    type: 'PLAYER_ASSIGNED',
    player: assignedPlayer,
    board: gameState.board
  }));
  
  console.log(`Player assigned: ${assignedPlayer}`);
  
  // Notify if game can start
  if (gameState.players.odd && gameState.players.even) {
    broadcastToAll({
      type: 'GAME_START',
      message: 'Both players connected. Game started!'
    });
  }
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'INCREMENT') {
        if (gameState.gameOver) {
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Game is over'
          }));
          return;
        }
        
        const { square } = data;
        
        // Validate square
        if (square < 0 || square >= 25) {
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Invalid square'
          }));
          return;
        }
        
        // Apply operation (increment by 1)
        gameState.board[square] += 1;
        
        // Broadcast update to all clients
        broadcastToAll({
          type: 'UPDATE',
          square,
          value: gameState.board[square]
        });
        
        // Check win condition
        const winResult = checkWinCondition();
        if (winResult) {
          gameState.gameOver = true;
          gameState.winner = winResult.winner;
          
          broadcastToAll({
            type: 'GAME_OVER',
            winner: winResult.winner,
            winningLine: winResult.line
          });
          
          console.log(`Game Over! Winner: ${winResult.winner}`);
        }
      } else if (data.type === 'RESET') {
        resetGame();
        broadcastToAll({
          type: 'GAME_RESET',
          board: gameState.board
        });
        console.log('Game reset');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(`Client disconnected: ${ws.playerType}`);
    
    // Remove player
    if (ws.playerType === 'ODD') {
      gameState.players.odd = null;
    } else if (ws.playerType === 'EVEN') {
      gameState.players.even = null;
    }
    
    // Notify other player
    broadcast({
      type: 'PLAYER_DISCONNECTED',
      player: ws.playerType,
      message: 'Opponent disconnected'
    });
    
    // Reset game
    resetGame();
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
console.log('Waiting for players to connect...');