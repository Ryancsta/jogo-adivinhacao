// Estado global do jogo
const gameState = {
    currentUser: null,
    sessionId: null,
    playerNumbers: [],
    opponentNumbers: [],
    guesses: [],
    opponentGuesses: [],
    timeLeft: 60,
    timerInterval: null,
    lastGameStats: null,
    chatMessages: 0
  };
  
  // Interface do usuário
  const UI = {
    screens: {
        login: document.getElementById('login-screen'),
        menu: document.getElementById('menu-screen'),
        profile: document.getElementById('profile-screen'),
        setup: document.getElementById('setup-screen'),
        waiting: document.getElementById('waiting-screen'),
        game: document.getElementById('game-screen'),
        opponentTurn: document.getElementById('opponent-turn-screen'),
        result: document.getElementById('result-screen'),
        // Nova tela para modo online
        onlineSetup: document.getElementById('online-setup-screen')
    },
    
    // Mostrar uma tela e esconder as outras
    showScreen(screenId) {
        for (const id in this.screens) {
            if ((id === 'onlineSetup' && screenId === 'online-setup') || 
                (id === screenId)) {
                this.screens[id === 'onlineSetup' ? 'onlineSetup' : id].classList.add('active');
                
                // Gerenciar música de fundo com base na tela
                if (typeof Audio !== 'undefined' && Audio.playBackgroundMusic) {
                    // Parar qualquer música atual primeiro
                    Audio.stopBackgroundMusic();
                    
                    // Iniciar música apropriada para a tela
                    if (screenId === 'menu') {
                        Audio.playBackgroundMusic('menuMusic');
                        Audio.play('notification');
                    } 
                    // A música do jogo é gerenciada no game.js quando inicia um jogo novo
                }
            } else {
                this.screens[id === 'onlineSetup' ? 'onlineSetup' : id].classList.remove('active');
            }
        }
    }
  };
  
  // Inicialização da aplicação
  document.addEventListener('DOMContentLoaded', () => {
    // Inicializar banco de dados
    DB.init();
    
    // Inicializar módulos
    Auth.init();
    Profile.init();
    Ranking.init();
    Game.init();
    
    // Inicializar o sistema de áudio
    if (typeof Audio !== 'undefined' && Audio.init) {
        Audio.init();
        
        // Adicionar som aos botões
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', () => {
                try {
                    Audio.play('buttonClick');
                } catch (error) {
                    console.log('Erro ao tocar som de botão:', error);
                }
            });
        });
    }
    
    // Inicializar o sistema de conquistas
    if (typeof Achievements !== 'undefined' && Achievements.init) {
        Achievements.init();
    }
    
    // Inicializar o sistema de replay
    if (typeof Replay !== 'undefined' && Replay.init) {
        Replay.init();
    }
    
    // Inicializar o cliente de socket para o modo online
    if (typeof SocketClient !== 'undefined') {
        SocketClient.init();
        
        // Após o login, autenticar com o socket
        const loginSuccessObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class' && 
                    UI.screens.menu.classList.contains('active') && 
                    gameState.currentUser) {
                    // Enviar informações do usuário para o servidor socket
                    SocketClient.login(gameState.currentUser);
                    loginSuccessObserver.disconnect(); // Autenticar apenas uma vez
                }
            });
        });
        
        // Observar mudanças na tela de menu para saber quando o login foi bem-sucedido
        loginSuccessObserver.observe(UI.screens.menu, { attributes: true });
    }
    
    // Inicializar o sistema de chat
    if (typeof Chat !== 'undefined' && Chat.init) {
        // O chat será inicializado quando o jogo começar
        // para não aparecer em outras telas
        
        const gameStartObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    const gameScreen = document.getElementById('game-screen');
                    if (gameScreen && gameScreen.classList.contains('active')) {
                        Chat.init();
                        gameStartObserver.disconnect(); // Inicializa apenas uma vez
                    }
                }
            });
        });
        
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameStartObserver.observe(gameScreen, { attributes: true });
        }
    }
    
    // Adicionar event listener para o botão de voltar ao menu da tela online
    const backToMenuFromOnlineBtn = document.getElementById('back-to-menu-from-online-btn');
    if (backToMenuFromOnlineBtn) {
        backToMenuFromOnlineBtn.addEventListener('click', () => {
            UI.showScreen('menu');
        });
    }
  });