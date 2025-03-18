// Funções relacionadas ao jogo
const Game = {
    // Elementos da interface
    elements: {
        // Menu
        newGameBtn: document.getElementById('new-game-btn'),
        
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
    
    // Inicializar jogo
    init() {
        // Event listeners
        this.setupEventListeners();
    },
    
    // Configurar os event listeners
    setupEventListeners() {
        const elements = this.elements;
        
        // Novo jogo
        elements.newGameBtn.addEventListener('click', () => {
            this.resetGame();
            
            // Iniciar música de fundo do jogo quando novo jogo começar
            if (typeof Audio !== 'undefined' && Audio.playBackgroundMusic) {
                Audio.playBackgroundMusic('gameMusic');
            }
            
            UI.showScreen('setup');
        });
        
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
                
                // Mostrar tela de espera
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
    
    // Resetar jogo
    resetGame() {
        // Limpar estado
        gameState.playerNumbers = [];
        gameState.opponentNumbers = [];
        gameState.guesses = [];
        gameState.opponentGuesses = [];
        
        // Limpar timer
        clearInterval(gameState.timerInterval);
        
        // Limpar elementos da interface
        this.elements.playerNumbersInput.value = '';
        this.elements.guessInput.value = '';
        this.elements.historyList.innerHTML = '';
        this.elements.setupMessage.textContent = '';
        this.elements.setupMessage.className = 'message';
        this.elements.guessMessage.textContent = '';
        this.elements.guessMessage.className = 'message';
        
        // Resetar o chat se estiver disponível
        if (typeof Chat !== 'undefined' && Chat.reset) {
            Chat.reset();
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
        gameState.timeLeft = 60;
        this.elements.timerDisplay.textContent = gameState.timeLeft;
        
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
            gameState.timeLeft--;
            this.elements.timerDisplay.textContent = gameState.timeLeft;
            
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
                
                setTimeout(() => {
                    this.simulateOpponentTurn();
                }, 1500);
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
    // Adicionando integração com o sistema de conquistas no Game.js

// Modificar o método showGameResult para registrar estatísticas da partida:
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
        this.elements.debugOpponentNumbers.textContent = gameState.opponentNumbers.join('');
    }
  };