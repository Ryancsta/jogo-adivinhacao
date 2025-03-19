// Cliente Socket.io para comunicação com o servidor
const SocketClient = {
  // Socket.io client
  socket: null,
  
  // Callbacks
  callbacks: {
    onMatchFound: null,
    onWaitingOpponent: null,
    onOpponentLeft: null,
    onGameStarted: null,
    onGuessResult: null,
    onOpponentGuess: null,
    onGameResult: null,
    onOpponentForfeit: null,
    onChatMessage: null,
    onError: null
  },
  
  // Inicializar conexão com o servidor
  init(serverUrl = '') {
    // Se não for fornecida uma URL, usar o host atual
    if (!serverUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      serverUrl = `${protocol}//${window.location.host}`;
    }
    
    console.log('Inicializando conexão com o servidor:', serverUrl);
    
    // Inicializar Socket.io
    this.socket = io(serverUrl);
    
    // Configurar event listeners
    this._setupEventListeners();
    
    return this;
  },
  
  // Configurar event listeners
  _setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Conectado ao servidor');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
    });
    
    this.socket.on('error', (error) => {
      console.error('Erro de socket:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
    
    this.socket.on('login-success', () => {
      console.log('Login no socket bem-sucedido');
    });
    
    this.socket.on('match-found', (data) => {
      console.log('Partida encontrada:', data);
      if (this.callbacks.onMatchFound) {
        this.callbacks.onMatchFound(data);
      }
    });
    
    this.socket.on('waiting-for-opponent', () => {
      console.log('Aguardando oponente...');
      if (this.callbacks.onWaitingOpponent) {
        this.callbacks.onWaitingOpponent();
      }
    });
    
    this.socket.on('waiting-for-opponent-numbers', () => {
      console.log('Aguardando oponente escolher números...');
    });
    
    this.socket.on('opponent-left', () => {
      console.log('Oponente saiu da partida');
      if (this.callbacks.onOpponentLeft) {
        this.callbacks.onOpponentLeft();
      }
    });
    
    this.socket.on('game-started', (data) => {
      console.log('Jogo iniciado:', data);
      if (this.callbacks.onGameStarted) {
        this.callbacks.onGameStarted(data);
      }
    });
    
    this.socket.on('guess-result', (data) => {
      console.log('Resultado do palpite:', data);
      if (this.callbacks.onGuessResult) {
        this.callbacks.onGuessResult(data);
      }
    });
    
    this.socket.on('opponent-guess', (data) => {
      console.log('Palpite do oponente:', data);
      if (this.callbacks.onOpponentGuess) {
        this.callbacks.onOpponentGuess(data);
      }
    });
    
    this.socket.on('game-result', (data) => {
      console.log('Resultado do jogo:', data);
      if (this.callbacks.onGameResult) {
        this.callbacks.onGameResult(data);
      }
    });
    
    this.socket.on('opponent-forfeit', (data) => {
      console.log('Oponente desistiu:', data);
      if (this.callbacks.onOpponentForfeit) {
        this.callbacks.onOpponentForfeit(data);
      }
    });
    
    this.socket.on('chat-message', (data) => {
      console.log('Mensagem de chat recebida:', data);
      if (this.callbacks.onChatMessage) {
        this.callbacks.onChatMessage(data);
      }
    });
    
    this.socket.on('game-timeout', () => {
      console.log('Jogo encerrado por inatividade');
      alert('A partida foi encerrada devido à inatividade.');
      // Redirecionar para o menu
      UI.showScreen('menu');
    });
  },
  
  // Métodos para interagir com o servidor
  
  // Autenticar usuário
  login(userData) {
    this.socket.emit('login', userData);
  },
  
  // Procurar uma partida
  findMatch() {
    this.socket.emit('find-match');
  },
  
  // Cancelar busca por partida
  cancelFindMatch() {
    this.socket.emit('cancel-find-match');
  },
  
  // Enviar números escolhidos
  submitNumbers(roomId, numbers) {
    this.socket.emit('submit-numbers', { roomId, numbers });
  },
  
  // Enviar palpite
  submitGuess(roomId, guess) {
    this.socket.emit('submit-guess', { roomId, guess });
  },
  
  // Enviar mensagem de chat
  sendChat(roomId, message) {
    this.socket.emit('send-chat', { roomId, message });
  },
  
  // Desistir do jogo
  forfeit(roomId) {
    this.socket.emit('forfeit', { roomId });
  },
  
  // Atualizar estatísticas
  updateStats(stats) {
    this.socket.emit('update-stats', stats);
  },
  
  // Registrar callbacks
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
    return this;
  }
};