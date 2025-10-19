import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Clock, Trophy, RotateCcw, Zap } from 'lucide-react';

const OddEvenTicTacToe = () => {
  const [board, setBoard] = useState(Array(25).fill(0));
  const [player, setPlayer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [chaosMode, setChaosMode] = useState(false);
  const [pendingSquares, setPendingSquares] = useState(new Set());
  const wsRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    connectToServer();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectToServer = () => {
    setConnectionStatus('CONNECTING');
    
    // Connect to WebSocket server
    const ws = new WebSocket('ws://localhost:8080');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to server');
      setConnectionStatus('WAITING');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      setConnectionStatus('DISCONNECTED');
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          connectToServer();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('DISCONNECTED');
    };
  };

  const handleServerMessage = (message) => {
    switch (message.type) {
      case 'PLAYER_ASSIGNED':
        setPlayer(message.player);
        setBoard(message.board);
        setConnectionStatus('WAITING');
        break;

      case 'GAME_START':
        setConnectionStatus('PLAYING');
        break;

      case 'UPDATE':
        setPendingSquares(prev => {
          const newSet = new Set(prev);
          newSet.delete(message.square);
          return newSet;
        });
        setBoard(prev => {
          const newBoard = [...prev];
          newBoard[message.square] = message.value;
          return newBoard;
        });
        break;

      case 'GAME_OVER':
        setGameOver(true);
        setWinner(message.winner);
        setWinningLine(message.winningLine);
        break;

      case 'GAME_RESET':
        setBoard(message.board);
        setGameOver(false);
        setWinner(null);
        setWinningLine([]);
        setPendingSquares(new Set());
        break;

      case 'PLAYER_DISCONNECTED':
        setConnectionStatus('WAITING');
        setGameOver(true);
        setWinner(null);
        break;

      case 'ERROR':
        console.error('Server error:', message.message);
        alert(message.message);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  };

  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (chaosMode) {
        const delay = Math.random() * 1000;
        setTimeout(() => {
          wsRef.current.send(JSON.stringify(message));
        }, delay);
      } else {
        wsRef.current.send(JSON.stringify(message));
      }
    }
  };

  const handleSquareClick = (index) => {
    if (gameOver || connectionStatus !== 'PLAYING') return;

    // Mark as pending (optimistic UI)
    setPendingSquares(prev => new Set(prev).add(index));

    // Send increment operation
    sendMessage({
      type: 'INCREMENT',
      square: index
    });
  };

  const resetGame = () => {
    sendMessage({ type: 'RESET' });
  };

  const getSquareColor = (value, index) => {
    if (pendingSquares.has(index)) return 'bg-yellow-200 animate-pulse';
    if (value === 0) return 'bg-gray-100';
    return value % 2 === 0 ? 'bg-emerald-100' : 'bg-blue-100';
  };

  const getSquareTextColor = (value) => {
    if (value === 0) return 'text-gray-400';
    return value % 2 === 0 ? 'text-emerald-700' : 'text-blue-700';
  };

  const getConnectionBadge = () => {
    const badges = {
      DISCONNECTED: { icon: WifiOff, text: 'Disconnected', color: 'bg-red-500' },
      CONNECTING: { icon: Clock, text: 'Connecting...', color: 'bg-yellow-500' },
      WAITING: { icon: Clock, text: 'Waiting for opponent...', color: 'bg-yellow-500' },
      PLAYING: { icon: Wifi, text: 'Playing', color: 'bg-green-500' }
    };
    
    const badge = badges[connectionStatus] || badges.DISCONNECTED;
    const Icon = badge.icon;
    
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${badge.color} text-white`}>
        <Icon size={16} />
        <span className="text-sm font-medium">{badge.text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Odd vs Even
          </h1>
          <p className="text-gray-600 text-lg">Multiplayer Tic-Tac-Toe 5x5</p>
        </div>

        {/* Status Bar */}
        <div className="flex justify-between items-center mb-6 bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-4">
            {getConnectionBadge()}
            {player && (
              <div className={`px-4 py-2 rounded-full ${
                player === 'ODD' ? 'bg-blue-500' : 'bg-emerald-500'
              } text-white font-bold shadow-md`}>
                You: {player}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setChaosMode(!chaosMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-md ${
                chaosMode 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Add random network lag to simulate race conditions"
            >
              <Zap size={16} />
              {chaosMode ? 'Chaos ON' : 'Chaos OFF'}
            </button>
            <button
              onClick={resetGame}
              disabled={connectionStatus !== 'PLAYING'}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="grid grid-cols-5 gap-3">
            {board.map((value, index) => (
              <button
                key={index}
                onClick={() => handleSquareClick(index)}
                disabled={gameOver || connectionStatus !== 'PLAYING'}
                className={`
                  aspect-square rounded-xl text-3xl font-bold
                  transition-all duration-200 transform
                  ${getSquareColor(value, index)}
                  ${getSquareTextColor(value)}
                  ${winningLine.includes(index) ? 'ring-4 ring-yellow-400 scale-105 shadow-xl' : ''}
                  ${gameOver || connectionStatus !== 'PLAYING' 
                    ? 'cursor-not-allowed opacity-60' 
                    : 'hover:scale-105 hover:shadow-lg cursor-pointer active:scale-95'
                  }
                `}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Game Over Modal */}
        {gameOver && winner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
              <Trophy className="mx-auto mb-4 text-yellow-500" size={64} />
              <h2 className="text-4xl font-bold mb-4">
                {winner === player ? '🎉 You Win!' : '😔 You Lose!'}
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                <span className={winner === 'ODD' ? 'text-blue-600' : 'text-emerald-600'}>
                  {winner} Player
                </span> wins!
              </p>
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Disconnected Modal */}
        {gameOver && !winner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
              <WifiOff className="mx-auto mb-4 text-red-500" size={64} />
              <h2 className="text-3xl font-bold mb-4">Game Ended</h2>
              <p className="text-lg text-gray-600 mb-6">
                Opponent disconnected
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition shadow-lg"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        {/* Legend & Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-lg">📖 How to Play</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-700 font-bold text-sm">1</span>
              <span className="text-sm text-gray-700">Odd numbers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center text-emerald-700 font-bold text-sm">2</span>
              <span className="text-sm text-gray-700">Even numbers</span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>• Click any square to increment its number by 1</p>
            <p>• Both players can click any square at any time</p>
            <p>• Win by getting 5 odd or 5 even numbers in a row/column/diagonal</p>
            <p>• <strong>Chaos Mode:</strong> Adds random network lag to test simultaneous clicks</p>
          </div>

          {connectionStatus === 'DISCONNECTED' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>⚠️ Server not connected.</strong> Start the server with: <code className="bg-red-100 px-2 py-1 rounded">node server.js</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OddEvenTicTacToe;