// Funções relacionadas ao jogo
const Game = {
    // Elementos da interface
    elements: {
        // Menu
        newGameBtn: document.getElementById('new-game-btn'),
        onlineGameBtn: document.getElementById('online-game-btn'),
        
        // Modo Online
        findMatchBtn: document.getElementById('find-match-btn'),
        cancelMatchBtn: document.getElementById('cancel-match-btn'),
        matchStatus: document.getElementById('match-status'),
        opponentInfo: document.getElementById('opponent-info'),
        opponentName: document.getElementById('opponent-name'),
        opponentPic: document.getElementById('opponent-pic'),
        opponentInitial: document.getElementById('opponent-initial'),
        turnIndicator: document.getElementById('turn-indicator'),
        roomIdDisplay: document.getElementById('room-id-display'),
        
        // Setup
        setupScreen: document.getElementById('setup-screen'),
        playerNumbersInput: document.getElementById('player-numbers-input'),
        confirmNumbersBtn: document.getElementById('confirm-numbers-btn'),
        backToMenuBtn: document.getElementById('back-to-menu-btn'),
        setupMessage: document.getElementById('setup-message'),
        
        // Waiting
        waitingScreen: document.getElementById('waiting-screen'),
        yourNumbersDisplay: document.getElementById('your-numbers-display'),
        
        // Game
        gameScreen: document.getElementById('game-screen'),
        timerDisplay: document.getElementById('timer-display'),
        guessInput: document.getElementById('guess-input'),
        guessBtn: document.getElementById('guess-btn'),
        giveUpBtn: document.getElementById('give-up-btn'),
        guessMessage: document.getElementById('guess-message'),
        historyList: document.getElementById('history-list'),
        debugYourNumbers: document.getElementById('debug-your-numbers'),
        debugOpponentNumbers: document.getElementById('debug-opponent-numbers'),
        
        // Opponent Turn
        opponentTurnScreen: document.getElementById('opponent-turn-screen'),
        opponentNameTurn: document.getElementById('opponent-name-turn'),
        
        // Result
        resultScreen: document.getElementById('result-screen'),
        resultTitle: document.getElementById('result-title'),
        resultMessage: document.getElementById('result-message'),
        playAgainBtn: document.getElementById('play-again-btn'),
        menuBtn: document.getElementById('menu-btn'),
        
        // Modal
        confirmModal: document.getElementById('confirm-modal'),
        confirmYes: document.getElementById('confirm-yes'),
        confirmNo: document.getElementById('confirm-no')
    },
    
    // Variável para rastrear o tempo total do jogo
    gameDuration: 0,
    gameStartTime: 0,
    
    // Modo de jogo atual (offline ou online)
    gameMode: 'offline',
    
    // Informações de partida online
    onlineMatch: {
        roomId: null,
        opponent: null,
        isPlayerTurn: false
    },
    
    // Inicializar jogo
    init() {
        // Event listeners
        this.setupEventListeners();
        
        // Se o SocketClient estiver disponível, inicializar callbacks
        if (typeof SocketClient !== 'undefined') {
            this.setupSocketCallbacks();
        }
    },
    
    // Configurar os event listeners
    setupEventListeners() {
        const elements = this.elements;
        
        // Novo jogo (offline)
        elements.newGameBtn.addEventListener('click', () => {
            this.resetGame();
            this.gameMode = 'offline';
            
            // Iniciar música de fundo do jogo quando novo jogo começar
            if (typeof Audio !== 'undefined' && Audio.playBackgroundMusic) {
                Audio.playBackgroundMusic('gameMusic');
            }
            
            UI.showScreen('setup');
        });
        
        // Novo jogo online
        if (elements.onlineGameBtn) {
            elements.onlineGameBtn.addEventListener('click', () => {
                this.resetGame();
                this.gameMode = 'online';
                
                // Mostrar tela de busca de partida
                UI.showScreen('online-setup');
                
                // Tocar som de notificação
                if (typeof Audio !== 'undefined') {
                    Audio.play('notification');
                }
            });
        }
        
        // Buscar partida online
        if (elements.findMatchBtn) {
            elements.findMatchBtn.addEventListener('click', () => {
                this.findMatch();
            });
        }
        
        // Cancelar busca de partida
        if (elements.cancelMatchBtn) {
            elements.cancelMatchBtn.addEventListener('click', () => {
                this.cancelFindMatch();
            });
        }
        
        // Voltar ao menu
        elements.backToMenuBtn.addEventListener('click', () => {
            UI.showScreen('menu');
        });
        
        // Confirmar números
        elements.confirmNumbersBtn.addEventListener('click', () => {
            const numbersStr = elements.playerNumbersInput.value;
            const validation = this.validateNumbers(numbersStr);
            
            if (validation.valid) {
                // Salvar números do jogador
                gameState.playerNumbers = validation.numbers;
                elements.yourNumbersDisplay.textContent = gameState.playerNumbers.join('');
                
                // Tocar som de confirmação
                if (typeof Audio !== 'undefined') {
                    Audio.play('correctGuess');
                }
                
                if (this.gameMode === 'online') {
                    // Modo online: enviar números para o servidor
                    if (this.onlineMatch.roomId) {
                        SocketClient.submitNumbers(this.onlineMatch.roomId, gameState.playerNumbers);
                        
                        // Mostrar mensagem de espera
                        elements.setupMessage.textContent = "Números confirmados! Aguardando o oponente...";
                        elements.setupMessage.className = "message info";
                        elements.confirmNumbersBtn.disabled = true;
                        
                        // Mostrar tela de espera
                        UI.showScreen('waiting');
                    }
                } else {
                    // Modo offline: mostrar tela de espera e continuar com IA
                    UI.showScreen('waiting');
                    
                    // Simular escolha do oponente
                    setTimeout(() => {
                        // Gerar números aleatórios para o oponente
                        gameState.opponentNumbers = this.generateOpponentNumbers();
                        
                        // Atualizar debug
                        this.updateDebugDisplay();
                        
                        // Iniciar jogo
                        UI.showScreen('game');
                        this.startTimer();
                    }, 2000);
                }
            } else {
                // Exibir erro
                elements.setupMessage.textContent = validation.message;
                elements.setupMessage.className = "message error";
                
                // Tocar som de erro
                if (typeof Audio !== 'undefined') {
                    Audio.play('wrongGuess');
                }
            }
        });
        
        // Botão de tentativa
        elements.guessBtn.addEventListener('click', () => {
            const guessStr = elements.guessInput.value;
            const validation = this.validateNumbers(guessStr);
            
            if (validation.valid) {
                // Verificar modo de jogo
                if (this.gameMode === 'online') {
                    // No modo online, verificar se é a vez do jogador
                    if (!this.onlineMatch.isPlayerTurn) {
                        elements.guessMessage.textContent = "Aguarde sua vez!";
                        elements.guessMessage.className = "message error";
                        return;
                    }
                    
                    // Parar o timer
                    clearInterval(gameState.timerInterval);
                    
                    // Enviar palpite para o servidor
                    SocketClient.submitGuess(this.onlineMatch.roomId, validation.numbers);
                    
                    // Desabilitar entrada de palpite
                    elements.guessInput.disabled = true;
                    elements.guessBtn.disabled = true;
                    elements.guessMessage.textContent = "Palpite enviado. Aguardando resposta...";
                    elements.guessMessage.className = "message info";
                    
                    // Limpar campo de entrada
                    elements.guessInput.value = '';
                } else {
                    // Modo offline - processar normalmente
                    clearInterval(gameState.timerInterval);
                    
                    // Verificar jogada
                    const guess = validation.numbers;
                    const hits = this.checkGuess(guess, gameState.opponentNumbers);
                    
                    // Armazenar tentativa
                    gameState.guesses.push({ guess, hits });
                    
                    // Atualizar histórico
                    this.addToHistory(guess, hits);
                    
                    // Verificar vitória
                    if (this.checkVictory(hits)) {
                        // Atualizar estatísticas
                        DB.updateStats(gameState.currentUser.id, true);
                        
                        // Mostrar resultado
                        this.showGameResult(true);
                        return;
                    }
                    
                    // Tocar som baseado no número de acertos
                    if (typeof Audio !== 'undefined') {
                        if (hits > 0) {
                            Audio.play('correctGuess');
                        } else {
                            Audio.play('wrongGuess');
                        }
                    }
                    
                    // Exibir resultado
                    if (hits === 0) {
                        elements.guessMessage.textContent = "Nenhum acerto!";
                    } else if (hits === 1) {
                        elements.guessMessage.textContent = "Um acerto!";
                    } else {
                        elements.guessMessage.textContent = `${hits} acertos!`;
                    }
                    elements.guessMessage.className = 'message info';
                    
                    // Limpar campo de entrada
                    elements.guessInput.value = '';
                    
                    // Simular vez do oponente
                    setTimeout(() => {
                        this.simulateOpponentTurn();
                    }, 1500);
                }
            } else {
                // Exibir erro
                elements.guessMessage.textContent = validation.message;
                elements.guessMessage.className = "message error";
                
                // Tocar som de erro
                if (typeof Audio !== 'undefined') {
                    Audio.play('wrongGuess');
                }
            }
        });
        
        // Botão de desistir
        elements.giveUpBtn.addEventListener('click', () => {
            // Mostrar modal de confirmação
            elements.confirmModal.style.display = 'flex';
        });
        
        // Confirmar desistência - Sim
        elements.confirmYes.addEventListener('click', () => {
            // Fechar modal
            elements.confirmModal.style.display = 'none';
            
            if (this.gameMode === 'online') {
                // Modo online: informar o servidor
                if (this.onlineMatch.roomId) {
                    SocketClient.forfeit(this.onlineMatch.roomId);
                    
                    // Tocar som de derrota
                    if (typeof Audio !== 'undefined') {
                        Audio.play('defeat');
                    }
                    
                    // Parar a música de fundo
                    if (typeof Audio !== 'undefined' && Audio.stopBackgroundMusic) {
                        Audio.stopBackgroundMusic();
                    }
                    
                    // Mensagem de espera
                    elements.guessMessage.textContent = "Você desistiu. Aguardando confirmação do servidor...";
                    elements.guessMessage.className = "message error";
                }
            } else {
                // Modo offline: processar localmente
                
                // Parar timer
                clearInterval(gameState.timerInterval);
                
                // Tocar som de derrota
                if (typeof Audio !== 'undefined') {
                    Audio.play('defeat');
                }
                
                // Parar a música de fundo
                if (typeof Audio !== 'undefined' && Audio.stopBackgroundMusic) {
                    Audio.stopBackgroundMusic();
                }
                
                // Atualizar estatísticas (jogador perdeu)
                DB.updateStats(gameState.currentUser.id, false);
                
                // Mostrar resultado
                elements.resultTitle.textContent = "Você desistiu";
                elements.resultMessage.textContent = `Você desistiu do jogo. Os números do oponente eram: ${gameState.opponentNumbers.join('')}`;
                elements.resultMessage.className = "message info";
                
                // Mostrar tela de resultado
                UI.showScreen('result');
            }
        });
        
        // Confirmar desistência - Não
        elements.confirmNo.addEventListener('click', () => {
            // Fechar modal
            elements.confirmModal.style.display = 'none';
        });
        
        // Jogar novamente
        elements.playAgainBtn.addEventListener('click', () => {
            this.resetGame();
            
            // Iniciar música de fundo do jogo novamente
            if (typeof Audio !== 'undefined' && Audio.playBackgroundMusic) {
                Audio.playBackgroundMusic('gameMusic');
            }
            
            UI.showScreen('setup');
        });
        
        // Voltar ao menu após fim de jogo
        elements.menuBtn.addEventListener('click', () => {
            // Resetar informações de partida online
            this.onlineMatch = {
                roomId: null,
                opponent: null,
                isPlayerTurn: false
            };
            
            UI.showScreen('menu');
        });
        
        // Permitir tecla Enter nos campos
        elements.playerNumbersInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                elements.confirmNumbersBtn.click();
            }
        });
        
        elements.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                elements.guessBtn.click();
            }
        });
    },
    
    // Configurar callbacks do socket
    setupSocketCallbacks() {
        if (typeof SocketClient === 'undefined') return;
        
        SocketClient
            .on('onMatchFound', (data) => {
                this.handleMatchFound(data);
            })
            .on('onWaitingOpponent', () => {
                this.handleWaitingOpponent();
            })
            .on('onOpponentLeft', () => {
                this.handleOpponentLeft();
            })
            .on('onGameStarted', (data) => {
                this.handleGameStarted(data);
            })
            .on('onGuessResult', (data) => {
                this.handleGuessResult(data);
            })
            .on('onOpponentGuess', (data) => {
                this.handleOpponentGuess(data);
            })
            .on('onGameResult', (data) => {
                this.handleGameResult(data);
            })
            .on('onOpponentForfeit', (data) => {
                this.handleOpponentForfeit(data);
            })
            .on('onChatMessage', (data) => {
                this.handleChatMessage(data);
            })
            .on('onError', (error) => {
                console.error('Erro do servidor:', error);
                alert(`Erro: ${error.message}`);
            });
    },
    
    // Resetar jogo
    resetGame() {
        // Limpar estado
        gameState.playerNumbers = [];
        gameState.opponentNumbers = [];
        gameState.guesses = [];
        gameState.opponentGuesses = [];
        
        // Resetar o temporizador e dados de duração
        clearInterval(gameState.timerInterval);
        this.gameStartTime = 0;
        this.gameDuration = 0;
        
        // Limpar elementos da interface
        this.elements.playerNumbersInput.value = '';
        this.elements.guessInput.value = '';
        this.elements.historyList.innerHTML = '';
        this.elements.setupMessage.textContent = '';
        this.elements.setupMessage.className = 'message';
        this.elements.guessMessage.textContent = '';
        this.elements.guessMessage.className = 'message';
        
        // Habilitar botão de confirmar números
        this.elements.confirmNumbersBtn.disabled = false;
        
        // Habilitar entrada de palpite
        this.elements.guessInput.disabled = false;
        this.elements.guessBtn.disabled = false;
        
        // Resetar o chat se estiver disponível
        if (typeof Chat !== 'undefined' && Chat.reset) {
            Chat.reset();
        }
        
        // Resetar informações de partida online se estiver no modo offline
        if (this.gameMode === 'offline') {
            this.onlineMatch = {
                roomId: null,
                opponent: null,
                isPlayerTurn: false
            };
        }
    },
    
    // Procurar partida online
    findMatch() {
        // Verificar se o SocketClient está disponível
        if (typeof SocketClient === 'undefined') {
            alert('Erro: Cliente de socket não disponível');
            return;
        }
        
        const elements = this.elements;
        
        // Atualizar UI
        elements.matchStatus.textContent = 'Procurando oponente...';
        elements.matchStatus.className = 'message info';
        elements.findMatchBtn.style.display = 'none';
        elements.cancelMatchBtn.style.display = 'block';
        
        // Enviar solicitação ao servidor
        SocketClient.findMatch();
        
        // Tocar som se disponível
        if (typeof Audio !== 'undefined') {
            Audio.play('notification');
        }
    },
    
    // Cancelar busca por partida
    cancelFindMatch() {
        const elements = this.elements;
        
        // Atualizar UI
        elements.matchStatus.textContent = '';
        elements.findMatchBtn.style.display = 'block';
        elements.cancelMatchBtn.style.display = 'none';
        
        // Enviar solicitação ao servidor
        SocketClient.cancelFindMatch();
    },
    
    // Atualizar informações do oponente na interface
    updateOpponentInfo(opponent) {
        const elements = this.elements;
        
        if (elements.opponentName) {
            elements.opponentName.textContent = opponent.username;
        }
        
        if (elements.opponentPic && elements.opponentInitial) {
            if (opponent.profilePic) {
                // Criar elemento de imagem
                const img = document.createElement('img');
                img.src = opponent.profilePic;
                img.alt = opponent.firstName;
                
                // Limpar o conteúdo atual
                elements.opponentPic.innerHTML = '';
                elements.opponentInitial.style.display = 'none';
                
                // Adicionar a imagem
                elements.opponentPic.appendChild(img);
            } else {
                // Usar inicial do nome
                const initial = opponent.firstName.charAt(0).toUpperCase();
                elements.opponentInitial.textContent = initial;
                elements.opponentInitial.style.display = 'block';
            }
        }
        
        // Atualizar nome no turno do oponente
        if (elements.opponentNameTurn) {
            elements.opponentNameTurn.textContent = opponent.username;
        }
    },
    
    // Atualizar indicador de turno na interface
    updateTurnIndicator() {
        const elements = this.elements;
        
        if (elements.turnIndicator) {
            if (this.onlineMatch.isPlayerTurn) {
                elements.turnIndicator.textContent = 'Sua vez';
                elements.turnIndicator.className = 'turn-indicator active';
            } else {
                elements.turnIndicator.textContent = 'Vez do oponente';
                elements.turnIndicator.className = 'turn-indicator';
            }
        }
    },
    
    // Gerar números aleatórios para o oponente
    generateOpponentNumbers() {
        const numbers = [];
        while (numbers.length < 3) {
            const num = Math.floor(Math.random() * 9) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        return numbers;
    },
    
    // Validar números escolhidos
    validateNumbers(numbersStr) {
        // Verificar se contém exatamente 3 caracteres
        if (numbersStr.length !== 3) {
            return { valid: false, message: "Digite exatamente 3 números." };
        }
        
        // Verificar se todos são dígitos entre 1 e 9
        if (!/^[1-9]{3}$/.test(numbersStr)) {
            return { valid: false, message: "Use apenas dígitos de 1 a 9." };
        }
        
        // Verificar se não há repetições
        const digits = numbersStr.split('').map(Number);
        const uniqueDigits = new Set(digits);
        
        if (uniqueDigits.size !== 3) {
            return { valid: false, message: "Não repita os números." };
        }
        
        return { valid: true, numbers: digits };
    },
    
    // Verificar acertos
    checkGuess(guess, target) {
        let hits = 0;
        
        // Para cada posição, verificar se o número e a posição coincidem
        for (let i = 0; i < 3; i++) {
            if (guess[i] === target[i]) {
                hits++;
            }
        }
        
        return hits;
    },
    
    // Verificar vitória
    checkVictory(hits) {
        return hits === 3;
    },
    
    // Adicionar entrada ao histórico
    addToHistory(guess, hits) {
        const entry = document.createElement('div');
        entry.textContent = `${guess.join('')}: ${hits} acerto${hits !== 1 ? 's' : ''}`;
        entry.style.marginBottom = "5px";
        this.elements.historyList.appendChild(entry);
    },
    
    // Iniciar timer
    startTimer() {
        // Registrar o tempo de início para cálculo da duração total
        if (this.gameStartTime === 0) {
            this.gameStartTime = Date.now();
        }
        
        gameState.timeLeft = 60;
        this.elements.timerDisplay.textContent = gameState.timeLeft;
        
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
            gameState.timeLeft--;
            this.elements.timerDisplay.textContent = gameState.timeLeft;
            
            // Atualizar a duração total do jogo
            this.gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);
            
            if (gameState.timeLeft <= 10) {
                this.elements.timerDisplay.style.color = "#d9534f";
                
                // Tocar o som de tick nos últimos 10 segundos
                if (typeof Audio !== 'undefined') {
                    Audio.play('tick');
                }
            } else {
                this.elements.timerDisplay.style.color = "#333";
            }
            
            if (gameState.timeLeft <= 0) {
                clearInterval(gameState.timerInterval);
                this.elements.guessMessage.textContent = "Tempo esgotado!";
                this.elements.guessMessage.className = "message error";
                
                // Tocar som de tempo esgotado
                if (typeof Audio !== 'undefined') {
                    // Parar o som de tick se estiver tocando
                    Audio.stop('tick');
                    // Tocar o som de tempo esgotado
                    Audio.play('timesUp');
                }
                
                if (this.gameMode === 'online') {
                    // No modo online, o servidor irá lidar com isso
                    // Notificar o servidor que o tempo acabou (similar a um palpite perdido)
                    if (this.onlineMatch.isPlayerTurn && this.onlineMatch.roomId) {
                        // Enviar um palpite aleatório
                        const randomGuess = this.generateOpponentNumbers();
                        SocketClient.submitGuess(this.onlineMatch.roomId, randomGuess);
                    }
                } else {
                    // Modo offline - simular vez do oponente
                    setTimeout(() => {
                        this.simulateOpponentTurn();
                    }, 1500);
                }
            }
        }, 1000);
    },
    
    // Simular turno do oponente
    simulateOpponentTurn() {
        UI.showScreen('opponentTurn');
        
        setTimeout(() => {
            // Gerar palpite do oponente
            let guess = [];
            while (guess.length < 3) {
                const num = Math.floor(Math.random() * 9) + 1;
                if (!guess.includes(num)) {
                    guess.push(num);
                }
            }
            
            // Verificar acertos
            const hits = this.checkGuess(guess, gameState.playerNumbers);
            
            // Armazenar tentativa
            gameState.opponentGuesses.push({ guess, hits });
            
            // Adicionar mensagem no chat sobre o resultado do palpite
            if (typeof Chat !== 'undefined' && Chat.sendOpponentGameMessage) {
                Chat.sendOpponentGameMessage(hits);
            }
            
            // Verificar vitória do oponente
            if (this.checkVictory(hits)) {
                // Atualizar estatísticas (jogador perdeu)
                DB.updateStats(gameState.currentUser.id, false);
                
                // Mostrar resultado
                this.showGameResult(false);
            } else {
                // Voltar para o jogador
                UI.showScreen('game');
                this.startTimer();
            }
        }, 2000);
    },
    
    // Mostrar resultado do jogo
    showGameResult(playerWon) {
        // Parar timer
        clearInterval(gameState.timerInterval);
        
        // Parar a música de fundo do jogo
        if (typeof Audio !== 'undefined' && Audio.stopBackgroundMusic) {
            Audio.stopBackgroundMusic();
        }
        
        // Registrar estatísticas para conquistas
        if (typeof Achievements !== 'undefined') {
            Achievements.registerGameEnd(
                playerWon, 
                gameState.guesses.length, 
                gameState.opponentGuesses
            );
        }
        
        // Salvar o replay da partida
        if (typeof Replay !== 'undefined') {
            Replay.saveGameReplay(
                playerWon,
                gameState.playerNumbers,
                gameState.opponentNumbers,
                gameState.guesses,
                gameState.opponentGuesses,
                this.gameDuration
            );
        }
        
        if (playerWon) {
            this.elements.resultTitle.textContent = "Parabéns!";
            this.elements.resultMessage.textContent = "Você venceu! Acertou todos os números do oponente.";
            this.elements.resultMessage.className = "message success";
            
            // Tocar som de vitória
            if (typeof Audio !== 'undefined') {
                Audio.play('victory');
            }
        } else {
            this.elements.resultTitle.textContent = "Você perdeu!";
            this.elements.resultMessage.textContent = "O oponente adivinhou seus números primeiro.";
            this.elements.resultMessage.className = "message error";
            
            // Tocar som de derrota
            if (typeof Audio !== 'undefined') {
                Audio.play('defeat');
            }
        }
        
        UI.showScreen('result');
    },
    
    // Atualizar debug display
    updateDebugDisplay() {
        this.elements.debugYourNumbers.textContent = gameState.playerNumbers.join('');
        if (this.gameMode === 'online' && !gameState.opponentNumbers.length) {
            this.elements.debugOpponentNumbers.textContent = "???";
        } else {
            this.elements.debugOpponentNumbers.textContent = gameState.opponentNumbers.join('');
        }
    },
    
    // ========== Funcionalidades para o modo Online ==========
    
    // Quando uma partida é encontrada
    handleMatchFound(data) {
        // Armazenar informações da partida
        this.onlineMatch.roomId = data.roomId;
        this.onlineMatch.opponent = data.opponent;
        
        const elements = this.elements;
        
        // Atualizar UI
        if (elements.matchStatus) {
            elements.matchStatus.textContent = `Partida encontrada! Jogando contra ${data.opponent.username}`;
            elements.matchStatus.className = 'message success';
            elements.findMatchBtn.style.display = 'none';
            elements.cancelMatchBtn.style.display = 'none';
        }
        
        // Mostrar informações do oponente
        this.updateOpponentInfo(data.opponent);
        
        // Exibir o ID da sala
        if (elements.roomIdDisplay) {
            elements.roomIdDisplay.textContent = `Sala: ${data.roomId}`;
        }
        
        // Ir para a tela de configuração
        setTimeout(() => {
            this.resetGame();
            
            // Iniciar música de fundo do jogo
            if (typeof Audio !== 'undefined' && Audio.playBackgroundMusic) {
                Audio.playBackgroundMusic('gameMusic');
            }
            
            UI.showScreen('setup');
        }, 1500);
        
        // Tocar som se disponível
        if (typeof Audio !== 'undefined') {
            Audio.play('notification');
        }
    },
    
    // Quando estamos aguardando um oponente
    handleWaitingOpponent() {
        const elements = this.elements;
        
        // Atualizar UI
        if (elements.matchStatus) {
            elements.matchStatus.textContent = 'Aguardando um oponente...';
            elements.matchStatus.className = 'message info';
            elements.findMatchBtn.style.display = 'none';
            elements.cancelMatchBtn.style.display = 'block';
        }
    },
    
    // Quando o oponente sai da partida
    handleOpponentLeft() {
        // Exibir mensagem
        alert('O oponente saiu da partida.');
        
        // Encerrar o jogo e limpar estado
        this.resetGame();
        this.onlineMatch = {
            roomId: null,
            opponent: null,
            isPlayerTurn: false
        };
        
        // Voltar para o menu
        UI.showScreen('menu');
        
        // Parar a música de fundo
        if (typeof Audio !== 'undefined' && Audio.stopBackgroundMusic) {Audio.stopBackgroundMusic();
        }
    },
    
    // Quando o jogo começa
    handleGameStarted(data) {
        // Armazenar se é nossa vez
        this.onlineMatch.isPlayerTurn = data.firstTurn;
        
        // Atualizar indicador de turno
        this.updateTurnIndicator();
        
        // Ir para a tela de jogo
        UI.showScreen('game');
        
        const elements = this.elements;
        
        // Desabilitar/habilitar interface com base no turno
        if (this.onlineMatch.isPlayerTurn) {
            // Habilitar entrada de palpite (é nossa vez)
            elements.guessInput.disabled = false;
            elements.guessBtn.disabled = false;
            elements.guessMessage.textContent = "Sua vez de adivinhar!";
            elements.guessMessage.className = "message info";
            this.startTimer(); // Iniciar timer
        } else {
            // Desabilitar entrada de palpite (vez do oponente)
            elements.guessInput.disabled = true;
            elements.guessBtn.disabled = true;
            elements.guessMessage.textContent = 'Aguardando o oponente fazer um palpite...';
            elements.guessMessage.className = 'message info';
        }
        
        // Atualizar debug
        this.updateDebugDisplay();
    },
    
    // Quando recebemos o resultado do nosso palpite
    handleGuessResult(data) {
        // Atualizar variável de turno
        this.onlineMatch.isPlayerTurn = data.yourTurn;
        
        // Atualizar indicador de turno
        this.updateTurnIndicator();
        
        // Armazenar o palpite
        gameState.guesses.push({
            guess: data.guess,
            hits: data.hits
        });
        
        // Adicionar ao histórico
        this.addToHistory(data.guess, data.hits);
        
        const elements = this.elements;
        
        // Exibir resultado
        if (data.hits === 0) {
            elements.guessMessage.textContent = "Nenhum acerto!";
        } else if (data.hits === 1) {
            elements.guessMessage.textContent = "Um acerto!";
        } else {
            elements.guessMessage.textContent = `${data.hits} acertos!`;
        }
        elements.guessMessage.className = 'message info';
        
        // Desabilitar entrada se não for nossa vez
        elements.guessInput.disabled = !data.yourTurn;
        elements.guessBtn.disabled = !data.yourTurn;
        
        // Iniciar timer se for nossa vez
        if (data.yourTurn) {
            elements.guessMessage.textContent = "Sua vez de adivinhar!";
            this.startTimer();
        }
        
        // Tocar som baseado no número de acertos
        if (typeof Audio !== 'undefined') {
            if (data.hits > 0) {
                Audio.play('correctGuess');
            } else {
                Audio.play('wrongGuess');
            }
        }
    },
    
    // Quando o oponente faz um palpite
    handleOpponentGuess(data) {
        // Atualizar variável de turno
        this.onlineMatch.isPlayerTurn = data.yourTurn;
        
        // Atualizar indicador de turno
        this.updateTurnIndicator();
        
        // Armazenar o palpite do oponente
        gameState.opponentGuesses.push({
            guess: data.guess,
            hits: data.hits
        });
        
        // Adicionar mensagem no chat
        if (typeof Chat !== 'undefined' && Chat.sendOpponentGameMessage) {
            Chat.sendOpponentGameMessage(data.hits);
        }
        
        const elements = this.elements;
        
        // Mostrar a tela de jogo (pode estar na tela de vez do oponente)
        UI.showScreen('game');
        
        // Exibir mensagem sobre o palpite do oponente
        let message = "";
        if (data.hits === 0) {
            message = "O oponente não acertou nenhum número!";
        } else if (data.hits === 1) {
            message = "O oponente acertou um número!";
        } else {
            message = `O oponente acertou ${data.hits} números!`;
        }
        
        elements.guessMessage.textContent = message;
        elements.guessMessage.className = 'message info';
        
        // Habilitar entrada se for nossa vez
        elements.guessInput.disabled = !data.yourTurn;
        elements.guessBtn.disabled = !data.yourTurn;
        
        if (data.yourTurn) {
            // Se for nossa vez, mostrar mensagem e iniciar timer
            setTimeout(() => {
                elements.guessMessage.textContent = "Sua vez de adivinhar!";
                this.startTimer();
            }, 1500);
        }
    },
    
    // Quando o jogo termina (resultado)
    handleGameResult(data) {
        // Parar timer
        clearInterval(gameState.timerInterval);
        
        // Guardar os números do oponente
        gameState.opponentNumbers = data.opponentNumbers;
        
        // Registrar estatísticas baseadas no resultado
        if (data.won) {
            // Atualizar estatísticas locais
            DB.updateStats(gameState.currentUser.id, true);
            
            // Atualizar estatísticas no servidor
            if (typeof SocketClient !== 'undefined') {
                SocketClient.updateStats(gameState.currentUser.stats);
            }
        } else {
            // Atualizar estatísticas locais
            DB.updateStats(gameState.currentUser.id, false);
            
            // Atualizar estatísticas no servidor
            if (typeof SocketClient !== 'undefined') {
                SocketClient.updateStats(gameState.currentUser.stats);
            }
        }
        
        // Exibir resultados
        this.showGameResult(data.won);
        
        // Resetar informações da partida online
        setTimeout(() => {
            this.onlineMatch = {
                roomId: null,
                opponent: null,
                isPlayerTurn: false
            };
        }, 1000);
    },
    
    // Quando o oponente desiste
    handleOpponentForfeit(data) {
        // Parar timer
        clearInterval(gameState.timerInterval);
        
        // Guardar os números do oponente
        gameState.opponentNumbers = data.opponentNumbers;
        
        // Atualizar estatísticas (vencemos por desistência)
        DB.updateStats(gameState.currentUser.id, true);
        
        // Atualizar estatísticas no servidor
        if (typeof SocketClient !== 'undefined') {
            SocketClient.updateStats(gameState.currentUser.stats);
        }
        
        // Exibir mensagem
        this.elements.resultTitle.textContent = "Oponente Desistiu";
        this.elements.resultMessage.textContent = `O oponente desistiu da partida. Você venceu! Os números do oponente eram: ${data.opponentNumbers.join('')}`;
        this.elements.resultMessage.className = "message success";
        
        // Tocar som de vitória
        if (typeof Audio !== 'undefined') {
            Audio.play('victory');
        }
        
        // Parar a música de fundo
        if (typeof Audio !== 'undefined' && Audio.stopBackgroundMusic) {
            Audio.stopBackgroundMusic();
        }
        
        // Mostrar tela de resultado
        UI.showScreen('result');
        
        // Resetar informações da partida online
        setTimeout(() => {
            this.onlineMatch = {
                roomId: null,
                opponent: null,
                isPlayerTurn: false
            };
        }, 1000);
    },
    
    // Quando o servidor confirma nossa desistência
    handleForfeitConfirmed(data) {
        // Guardar os números do oponente
        gameState.opponentNumbers = data.opponentNumbers;
        
        // Parar timer
        clearInterval(gameState.timerInterval);
        
        // Atualizar estatísticas (perdemos por desistência)
        DB.updateStats(gameState.currentUser.id, false);
        
        // Atualizar estatísticas no servidor
        if (typeof SocketClient !== 'undefined') {
            SocketClient.updateStats(gameState.currentUser.stats);
        }
        
        // Exibir mensagem
        this.elements.resultTitle.textContent = "Você Desistiu";
        this.elements.resultMessage.textContent = `Você desistiu da partida. Os números do oponente eram: ${data.opponentNumbers.join('')}`;
        this.elements.resultMessage.className = "message info";
        
        // Mostrar tela de resultado
        UI.showScreen('result');
        
        // Resetar informações da partida online
        setTimeout(() => {
            this.onlineMatch = {
                roomId: null,
                opponent: null,
                isPlayerTurn: false
            };
        }, 1000);
    },
    
    // Processar mensagem de chat
    handleChatMessage(data) {
        if (typeof Chat !== 'undefined' && Chat.addOpponentMessage) {
            Chat.addOpponentMessage(data.message);
        }
    },
    
    // Enviar mensagem de chat
    sendChatMessage(message) {
        if (this.gameMode !== 'online' || !this.onlineMatch.roomId) return;
        
        if (typeof SocketClient !== 'undefined') {
            SocketClient.sendChat(this.onlineMatch.roomId, message);
        }
    }
};