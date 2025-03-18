// Sistema de Replay de Partidas
const Replay = {
  // Lista de partidas salvas
  savedGames: [],
  
  // Elementos da interface
  elements: {
      replayButton: null,
      replayModal: null,
      replayList: null,
      replayPlayer: null,
      closeButton: null,
      playPauseButton: null,
      speedControl: null,
      currentReplay: null
  },
  
  // Estado do replay atual
  currentReplayIndex: -1,
  currentStep: 0,
  isPlaying: false,
  playbackInterval: null,
  playbackSpeed: 1,
  
  // Inicializar o sistema de replay
  init() {
      // Carregar partidas salvas do localStorage
      this.loadSavedGames();
      
      // Criar elementos da interface
      this.createUI();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      console.log("Sistema de replay inicializado");
  },
  
  // Carregar partidas salvas
  loadSavedGames() {
      try {
          if (gameState.currentUser && gameState.currentUser.id) {
              const userId = gameState.currentUser.id;
              const key = `gameReplays_${userId}`;
              
              const savedReplays = localStorage.getItem(key);
              if (savedReplays) {
                  this.savedGames = JSON.parse(savedReplays);
                  
                  // Converter strings de data para objetos Date
                  this.savedGames.forEach(game => {
                      game.date = new Date(game.date);
                  });
                  
                  // Ordenar por data (mais recente primeiro)
                  this.savedGames.sort((a, b) => b.date - a.date);
              }
          }
      } catch (error) {
          console.log("Erro ao carregar partidas salvas:", error);
          this.savedGames = [];
      }
  },
  
  // Salvar partidas no localStorage
  saveGames() {
      try {
          if (gameState.currentUser && gameState.currentUser.id) {
              const userId = gameState.currentUser.id;
              const key = `gameReplays_${userId}`;
              
              localStorage.setItem(key, JSON.stringify(this.savedGames));
          }
      } catch (error) {
          console.log("Erro ao salvar partidas:", error);
      }
  },
  
  // Criar elementos da interface
  createUI() {
      // Adicionar botão no menu
      const menuScreen = document.getElementById('menu-screen');
      if (!menuScreen) return;
      
      // Botão de replay no menu
      const replayButton = document.createElement('button');
      replayButton.id = 'replay-btn';
      replayButton.className = 'btn';
      replayButton.textContent = 'Ver Partidas';
      
      // Inserir o botão após o botão de ranking
      const rankingBtn = document.getElementById('ranking-btn');
      if (rankingBtn && rankingBtn.parentNode) {
          rankingBtn.parentNode.insertBefore(replayButton, rankingBtn.nextSibling);
      } else {
          menuScreen.appendChild(replayButton);
      }
      
      // Modal de replay
      const replayModal = document.createElement('div');
      replayModal.id = 'replay-modal';
      replayModal.className = 'modal';
      
      // Conteúdo do modal
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content replay-modal-content';
      
      // Cabeçalho
      const modalHeader = document.createElement('div');
      modalHeader.className = 'replay-header';
      modalHeader.innerHTML = '<h3>Partidas Salvas</h3>';
      
      // Botão para fechar
      const closeButton = document.createElement('button');
      closeButton.className = 'close-btn';
      closeButton.innerHTML = '&times;';
      modalHeader.appendChild(closeButton);
      
      // Container para duas colunas
      const replayContainer = document.createElement('div');
      replayContainer.className = 'replay-container';
      
      // Lista de partidas
      const replayList = document.createElement('div');
      replayList.className = 'replay-list';
      
      // Player de replay
      const replayPlayer = document.createElement('div');
      replayPlayer.className = 'replay-player';
      replayPlayer.innerHTML = `
          <div class="replay-info">
              <h4 id="replay-title">Selecione uma partida</h4>
              <p id="replay-date"></p>
          </div>
          <div class="replay-board">
              <div class="replay-numbers">
                  <div class="replay-player-numbers">
                      <span>Seus números: </span>
                      <span id="replay-player-nums">---</span>
                  </div>
                  <div class="replay-opponent-numbers">
                      <span>Números do oponente: </span>
                      <span id="replay-opponent-nums">---</span>
                  </div>
              </div>
              <div class="replay-history" id="replay-history">
                  <p class="replay-message">Escolha uma partida para ver o replay</p>
              </div>
          </div>
          <div class="replay-controls">
              <button id="replay-play-btn" class="btn" disabled>▶️ Reproduzir</button>
              <div class="replay-speed">
                  <label for="replay-speed-control">Velocidade:</label>
                  <select id="replay-speed-control">
                      <option value="0.5">0.5x</option>
                      <option value="1" selected>1x</option>
                      <option value="2">2x</option>
                      <option value="4">4x</option>
                  </select>
              </div>
          </div>
      `;
      
      // Adicionar elementos ao container
      replayContainer.appendChild(replayList);
      replayContainer.appendChild(replayPlayer);
      
      // Montar modal
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(replayContainer);
      replayModal.appendChild(modalContent);
      
      // Adicionar ao DOM
      document.body.appendChild(replayModal);
      
      // Salvar referências
      this.elements.replayButton = replayButton;
      this.elements.replayModal = replayModal;
      this.elements.replayList = replayList;
      this.elements.replayPlayer = replayPlayer;
      this.elements.closeButton = closeButton;
      this.elements.playPauseButton = document.getElementById('replay-play-btn');
      this.elements.speedControl = document.getElementById('replay-speed-control');
      this.elements.currentReplay = {
          title: document.getElementById('replay-title'),
          date: document.getElementById('replay-date'),
          playerNums: document.getElementById('replay-player-nums'),
          opponentNums: document.getElementById('replay-opponent-nums'),
          history: document.getElementById('replay-history')
      };
  },
  
  // Configurar event listeners
  setupEventListeners() {
      const elements = this.elements;
      
      // Botão de replay
      if (elements.replayButton) {
          elements.replayButton.addEventListener('click', () => {
              this.showReplays();
          });
      }
      
      // Botão de fechar
      if (elements.closeButton) {
          elements.closeButton.addEventListener('click', () => {
              this.stopReplay();
              elements.replayModal.style.display = 'none';
          });
      }
      
      // Fechar ao clicar fora do modal
      if (elements.replayModal) {
          elements.replayModal.addEventListener('click', (e) => {
              if (e.target === elements.replayModal) {
                  this.stopReplay();
                  elements.replayModal.style.display = 'none';
              }
          });
      }
      
      // Botão play/pause
      if (elements.playPauseButton) {
          elements.playPauseButton.addEventListener('click', () => {
              if (this.isPlaying) {
                  this.pauseReplay();
              } else {
                  this.playReplay();
              }
          });
      }
      
      // Controle de velocidade
      if (elements.speedControl) {
          elements.speedControl.addEventListener('change', () => {
              this.playbackSpeed = parseFloat(elements.speedControl.value);
              
              // Se estiver reproduzindo, reiniciar com a nova velocidade
              if (this.isPlaying) {
                  this.pauseReplay();
                  this.playReplay();
              }
          });
      }
  },
  
  // Mostrar modal de replays
  showReplays() {
      // Limpar lista de replays
      if (this.elements.replayList) {
          this.elements.replayList.innerHTML = '';
          
          // Verificar se há partidas salvas
          if (this.savedGames.length === 0) {
              const emptyMessage = document.createElement('p');
              emptyMessage.className = 'replay-empty-message';
              emptyMessage.textContent = 'Nenhuma partida salva encontrada.';
              this.elements.replayList.appendChild(emptyMessage);
          } else {
              // Adicionar cada partida à lista
              this.savedGames.forEach((game, index) => {
                  const replayItem = document.createElement('div');
                  replayItem.className = 'replay-item';
                  
                  // Resultado
                  const resultClass = game.result === 'victory' ? 'victory' : 'defeat';
                  const resultText = game.result === 'victory' ? 'Vitória' : 'Derrota';
                  
                  // Data formatada
                  const dateOptions = { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                  };
                  const formattedDate = game.date.toLocaleDateString('pt-BR', dateOptions);
                  
                  // Estrutura do item
                  replayItem.innerHTML = `
                      <div class="replay-result ${resultClass}">${resultText}</div>
                      <div class="replay-item-details">
                          <div class="replay-item-date">${formattedDate}</div>
                          <div class="replay-item-stats">
                              <span>${game.attempts} tentativas</span>
                              <span>${game.duration} segundos</span>
                          </div>
                      </div>
                  `;
                  
                  // Event listener para selecionar esta partida
                  replayItem.addEventListener('click', () => {
                      this.selectReplay(index);
                  });
                  
                  this.elements.replayList.appendChild(replayItem);
              });
          }
      }
      
      // Mostrar modal
      if (this.elements.replayModal) {
          this.elements.replayModal.style.display = 'flex';
      }
  },
  
  // Selecionar uma partida para replay
  selectReplay(index) {
      // Parar qualquer replay em andamento
      this.stopReplay();
      
      // Definir o índice atual
      this.currentReplayIndex = index;
      this.currentStep = 0;
      
      const game = this.savedGames[index];
      const elements = this.elements.currentReplay;
      
      // Atualizar informações no player
      if (elements) {
          // Título
          elements.title.textContent = game.result === 'victory' ? 'Vitória' : 'Derrota';
          elements.title.className = game.result === 'victory' ? 'victory-title' : 'defeat-title';
          
          // Data
          const dateOptions = { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
          };
          elements.date.textContent = game.date.toLocaleDateString('pt-BR', dateOptions);
          
          // Números
          elements.playerNums.textContent = game.playerNumbers.join('');
          elements.opponentNums.textContent = game.result === 'victory' ? game.opponentNumbers.join('') : '???';
          
          // Histórico - limpar
          elements.history.innerHTML = '';
          elements.history.className = 'replay-history';
          
          // Mensagem inicial
          const initialMessage = document.createElement('p');
          initialMessage.className = 'replay-message';
          initialMessage.textContent = 'Clique em Reproduzir para iniciar o replay';
          elements.history.appendChild(initialMessage);
          
          // Habilitar botão de play
          this.elements.playPauseButton.disabled = false;
          this.elements.playPauseButton.textContent = '▶️ Reproduzir';
      }
  },
  
  // Reproduzir o replay
  playReplay() {
      if (this.currentReplayIndex < 0 || this.currentReplayIndex >= this.savedGames.length) return;
      
      const game = this.savedGames[this.currentReplayIndex];
      const history = this.elements.currentReplay.history;
      
      // Limpar histórico se estiver começando do início
      if (this.currentStep === 0) {
          history.innerHTML = '';
      }
      
      // Definir o estado como reproduzindo
      this.isPlaying = true;
      this.elements.playPauseButton.textContent = '⏸️ Pausar';
      
      // Calcular o intervalo com base na velocidade
      const baseInterval = 1000; // 1 segundo
      const interval = baseInterval / this.playbackSpeed;
      
      // Iniciar o intervalo para reprodução
      this.playbackInterval = setInterval(() => {
          // Verificar se o replay já acabou
          if (this.currentStep >= game.playerGuesses.length + game.opponentGuesses.length) {
              this.stopReplay();
              
              // Mostrar mensagem de fim
              const endMessage = document.createElement('p');
              endMessage.className = 'replay-end-message';
              endMessage.textContent = game.result === 'victory' ? 
                  'Você venceu ao adivinhar todos os números do oponente!' : 
                  'O oponente adivinhou todos os seus números primeiro.';
              history.appendChild(endMessage);
              
              // Revelar os números do oponente se for derrota
              if (game.result === 'defeat') {
                  this.elements.currentReplay.opponentNums.textContent = game.opponentNumbers.join('');
              }
              
              return;
          }
          
          // Determinar se é uma jogada do jogador ou do oponente
          // Cada jogada tem um índice baseado no turno
          // Jogador: turnos pares (0, 2, 4...)
          // Oponente: turnos ímpares (1, 3, 5...)
          const isPlayerTurn = this.currentStep % 2 === 0;
          const guessIndex = Math.floor(this.currentStep / 2);
          
          if (isPlayerTurn) {
              // Verificar se há jogada do jogador disponível
              if (guessIndex < game.playerGuesses.length) {
                  const playerGuess = game.playerGuesses[guessIndex];
                  
                  const guessElement = document.createElement('div');
                  guessElement.className = 'replay-guess player-guess';
                  guessElement.innerHTML = `
                      <div class="replay-turn-indicator">Sua jogada</div>
                      <div class="replay-guess-numbers">${playerGuess.guess.join('')}</div>
                      <div class="replay-guess-result">
                          <span class="replay-hits">${playerGuess.hits} acerto${playerGuess.hits !== 1 ? 's' : ''}</span>
                      </div>
                  `;
                  
                  history.appendChild(guessElement);
                  history.scrollTop = history.scrollHeight;
              }
          } else {
              // Verificar se há jogada do oponente disponível
              if (guessIndex < game.opponentGuesses.length) {
                  const opponentGuess = game.opponentGuesses[guessIndex];
                  
                  const guessElement = document.createElement('div');
                  guessElement.className = 'replay-guess opponent-guess';
                  guessElement.innerHTML = `
                      <div class="replay-turn-indicator">Jogada do oponente</div>
                      <div class="replay-guess-numbers">${opponentGuess.guess.join('')}</div>
                      <div class="replay-guess-result">
                          <span class="replay-hits">${opponentGuess.hits} acerto${opponentGuess.hits !== 1 ? 's' : ''}</span>
                      </div>
                  `;
                  
                  history.appendChild(guessElement);
                  history.scrollTop = history.scrollHeight;
              }
          }
          
          // Avançar para o próximo passo
          this.currentStep++;
      }, interval);
  },
  
  // Pausar a reprodução
  pauseReplay() {
      if (this.playbackInterval) {
          clearInterval(this.playbackInterval);
          this.playbackInterval = null;
      }
      
      this.isPlaying = false;
      this.elements.playPauseButton.textContent = '▶️ Reproduzir';
  },
  
  // Parar completamente o replay
  stopReplay() {
      this.pauseReplay();
      this.currentStep = 0;
  },
  
  // Registrar uma partida finalizada
  saveGameReplay(playerWon, playerNumbers, opponentNumbers, playerGuesses, opponentGuesses, gameDuration) {
      // Criar objeto de replay
      const gameReplay = {
          date: new Date(),
          result: playerWon ? 'victory' : 'defeat',
          playerNumbers: [...playerNumbers],
          opponentNumbers: [...opponentNumbers],
          playerGuesses: [...playerGuesses],
          opponentGuesses: [...opponentGuesses],
          attempts: playerGuesses.length,
          duration: gameDuration
      };
      
      // Limitar a quantidade de replays salvos (manter apenas os 20 mais recentes)
      this.savedGames.unshift(gameReplay);
      if (this.savedGames.length > 20) {
          this.savedGames = this.savedGames.slice(0, 20);
      }
      
      // Salvar no localStorage
      this.saveGames();
      
      return gameReplay;
  }
};