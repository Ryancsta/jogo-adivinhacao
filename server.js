// Servidor para jogo multiplayer de adivinhação de números
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir arquivos estáticos da pasta raiz do projeto
// Servir arquivos da raiz
app.use(express.static(__dirname));
// E também servir arquivos da subpasta
app.use(express.static(path.join(__dirname, 'jogo-adivinhacao'))); // substitua 'suapasta' pelo nome da sua pasta

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'jogo-adivinhacao', 'index.html'));
});
// Armazenar informações sobre usuários, salas e jogos
const users = {};          // userId -> userInfo
const userSockets = {};    // userId -> socketId
const rooms = {};          // roomId -> roomInfo
const waitingPlayers = []; // lista de jogadores aguardando oponente

// Função para gerar ID aleatório
function generateId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Criar uma nova sala de jogo
function createRoom(player1Id, player2Id) {
  const roomId = generateId();
  
  rooms[roomId] = {
    id: roomId,
    players: [player1Id, player2Id],
    playerNumbers: {},
    playerReady: {},
    currentTurn: null,
    gameStarted: false,
    gameFinished: false,
    guesses: {},
    lastActivity: Date.now()
  };
  
  return roomId;
}

// Remover um jogador de todas as salas
function removePlayerFromRooms(playerId) {
  // Remover da fila de espera
  const waitingIndex = waitingPlayers.indexOf(playerId);
  if (waitingIndex !== -1) {
    waitingPlayers.splice(waitingIndex, 1);
  }
  
  // Remover/encerrar salas ativas
  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (room.players.includes(playerId)) {
      // Informar o outro jogador que o oponente saiu
      const otherPlayerId = room.players.find(id => id !== playerId);
      if (otherPlayerId && userSockets[otherPlayerId]) {
        io.to(userSockets[otherPlayerId]).emit('opponent-left');
      }
      
      // Remover a sala
      delete rooms[roomId];
    }
  }
}

// Limpeza periódica de salas inativas (5 minutos sem atividade)
setInterval(() => {
  const now = Date.now();
  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (now - room.lastActivity > 5 * 60 * 1000) {
      // Notificar os jogadores
      room.players.forEach(playerId => {
        if (userSockets[playerId]) {
          io.to(userSockets[playerId]).emit('game-timeout');
        }
      });
      
      // Remover a sala
      delete rooms[roomId];
    }
  }
}, 60 * 1000); // Verificar a cada minuto

// Configurar conexões de socket
io.on('connection', (socket) => {
  console.log(`Novo cliente conectado: ${socket.id}`);
  let currentUserId = null;
  
  // Autenticação/Login
  socket.on('login', (userData) => {
    const userId = userData.id;
    
    // Armazenar informações do usuário
    users[userId] = {
      id: userId,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profilePic: userData.profilePic,
      stats: userData.stats || { wins: 0, gamesPlayed: 0 }
    };
    
    // Associar socket ao usuário
    userSockets[userId] = socket.id;
    currentUserId = userId;
    
    console.log(`Usuário autenticado: ${userData.username} (${userId})`);
    socket.emit('login-success');
  });
  
  // Procurar uma partida
  socket.on('find-match', () => {
    if (!currentUserId) {
      socket.emit('error', { message: 'Usuário não autenticado' });
      return;
    }
    
    console.log(`${currentUserId} está procurando uma partida`);
    
    // Se já houver alguém na fila de espera, criar uma sala
    if (waitingPlayers.length > 0) {
      const opponentId = waitingPlayers.shift();
      
      // Verificar se o oponente ainda está conectado
      if (userSockets[opponentId]) {
        // Criar uma nova sala
        const roomId = createRoom(currentUserId, opponentId);
        
        // Informar ambos os jogadores sobre a partida
        socket.emit('match-found', {
          roomId,
          opponent: users[opponentId]
        });
        
        io.to(userSockets[opponentId]).emit('match-found', {
          roomId,
          opponent: users[currentUserId]
        });
        
        console.log(`Partida criada: ${currentUserId} vs ${opponentId} na sala ${roomId}`);
      } else {
        // Se o oponente desconectou, adicionar este jogador à fila
        waitingPlayers.push(currentUserId);
        socket.emit('waiting-for-opponent');
      }
    } else {
      // Adicionar à fila de espera
      waitingPlayers.push(currentUserId);
      socket.emit('waiting-for-opponent');
    }
  });
  
  // Cancelar busca de partida
  socket.on('cancel-find-match', () => {
    if (!currentUserId) return;
    
    const index = waitingPlayers.indexOf(currentUserId);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
      socket.emit('search-canceled');
    }
  });
  
  // Enviar números escolhidos
  socket.on('submit-numbers', ({ roomId, numbers }) => {
    if (!currentUserId || !rooms[roomId]) return;
    
    const room = rooms[roomId];
    
    // Verificar se o jogador pertence a esta sala
    if (!room.players.includes(currentUserId)) {
      socket.emit('error', { message: 'Sala inválida' });
      return;
    }
    
    // Salvar os números do jogador
    room.playerNumbers[currentUserId] = numbers;
    room.playerReady[currentUserId] = true;
    
    // Atualizar timestamp de atividade
    room.lastActivity = Date.now();
    
    // Inicializar array de palpites
    if (!room.guesses[currentUserId]) {
      room.guesses[currentUserId] = [];
    }
    
    // Verificar se ambos os jogadores enviaram seus números
    const allPlayersReady = room.players.every(
      playerId => room.playerReady[playerId]
    );
    
    if (allPlayersReady && !room.gameStarted) {
      // Escolher aleatoriamente quem começa
      const randomIndex = Math.floor(Math.random() * 2);
      room.currentTurn = room.players[randomIndex];
      room.gameStarted = true;
      
      // Informar ambos os jogadores que o jogo começou
      room.players.forEach(playerId => {
        if (userSockets[playerId]) {
          io.to(userSockets[playerId]).emit('game-started', {
            firstTurn: room.currentTurn === playerId
          });
        }
      });
      
      console.log(`Jogo iniciado na sala ${roomId}, primeiro turno: ${room.currentTurn}`);
    } else {
      // Informar o jogador que está aguardando o oponente
      socket.emit('waiting-for-opponent-numbers');
    }
  });
  
  // Enviar palpite
  socket.on('submit-guess', ({ roomId, guess }) => {
    if (!currentUserId || !rooms[roomId]) return;
    
    const room = rooms[roomId];
    
    // Verificar se é a vez deste jogador
    if (room.currentTurn !== currentUserId || room.gameFinished) {
      socket.emit('error', { message: 'Não é sua vez' });
      return;
    }
    
    // Encontrar o ID do oponente
    const opponentId = room.players.find(id => id !== currentUserId);
    if (!opponentId) return;
    
    // Verificar o palpite contra os números do oponente
    const opponentNumbers = room.playerNumbers[opponentId];
    let hits = 0;
    
    // Para cada posição, verificar se o número e a posição coincidem
    for (let i = 0; i < 3; i++) {
      if (guess[i] === opponentNumbers[i]) {
        hits++;
      }
    }
    
    // Registrar o palpite
    room.guesses[currentUserId].push({ guess, hits });
    
    // Atualizar timestamp de atividade
    room.lastActivity = Date.now();
    
    // Verificar vitória
    if (hits === 3) {
      room.gameFinished = true;
      
      // Atualizar estatísticas
      users[currentUserId].stats.wins++;
      users[currentUserId].stats.gamesPlayed++;
      users[opponentId].stats.gamesPlayed++;
      
      // Informar ambos os jogadores sobre o resultado
      socket.emit('game-result', {
        won: true,
        opponentNumbers
      });
      
      if (userSockets[opponentId]) {
        io.to(userSockets[opponentId]).emit('game-result', {
          won: false,
          opponentNumbers: room.playerNumbers[currentUserId]
        });
      }
      
      console.log(`Jogo finalizado na sala ${roomId}, vencedor: ${currentUserId}`);
    } else {
      // Alternar turno
      room.currentTurn = opponentId;
      
      // Informar jogadores sobre o resultado do palpite
      socket.emit('guess-result', {
        guess,
        hits,
        yourTurn: false
      });
      
      if (userSockets[opponentId]) {
        io.to(userSockets[opponentId]).emit('opponent-guess', {
          guess,
          hits,
          yourTurn: true
        });
      }
    }
  });
  
  // Enviar mensagem de chat
  socket.on('send-chat', ({ roomId, message }) => {
    if (!currentUserId || !rooms[roomId]) return;
    
    const room = rooms[roomId];
    
    // Verificar se o jogador pertence a esta sala
    if (!room.players.includes(currentUserId)) return;
    
    // Encontrar o ID do oponente
    const opponentId = room.players.find(id => id !== currentUserId);
    if (!opponentId || !userSockets[opponentId]) return;
    
    // Atualizar timestamp de atividade
    room.lastActivity = Date.now();
    
    // Enviar mensagem para o oponente
    io.to(userSockets[opponentId]).emit('chat-message', {
      senderId: currentUserId,
      senderName: users[currentUserId].username,
      message
    });
  });
  
  // Desistir do jogo
  socket.on('forfeit', ({ roomId }) => {
    if (!currentUserId || !rooms[roomId]) return;
    
    const room = rooms[roomId];
    
    // Verificar se o jogador pertence a esta sala
    if (!room.players.includes(currentUserId)) return;
    
    // Marcar o jogo como finalizado
    room.gameFinished = true;
    
    // Encontrar o ID do oponente
    const opponentId = room.players.find(id => id !== currentUserId);
    if (!opponentId) return;
    
    // Atualizar estatísticas
    users[opponentId].stats.wins++;
    users[currentUserId].stats.gamesPlayed++;
    users[opponentId].stats.gamesPlayed++;
    
    // Informar o oponente sobre a desistência
    if (userSockets[opponentId]) {
      io.to(userSockets[opponentId]).emit('opponent-forfeit', {
        opponentNumbers: room.playerNumbers[currentUserId]
      });
    }
    
    // Informar o jogador que desistiu
    socket.emit('forfeit-confirmed', {
      opponentNumbers: room.playerNumbers[opponentId]
    });
    
    console.log(`Jogador ${currentUserId} desistiu na sala ${roomId}`);
  });
  
  // Atualizar estatísticas
  socket.on('update-stats', (stats) => {
    if (!currentUserId) return;
    
    if (users[currentUserId]) {
      users[currentUserId].stats = stats;
    }
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    if (currentUserId) {
      console.log(`Usuário desconectado: ${currentUserId}`);
      
      // Remover de todas as salas e notificar oponentes
      removePlayerFromRooms(currentUserId);
      
      // Remover associações
      delete userSockets[currentUserId];
    }
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});