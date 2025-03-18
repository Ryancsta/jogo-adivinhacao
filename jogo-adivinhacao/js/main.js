// Estado global do jogo
const gameState = {
    currentUser: null,
    sessionId: null,
    playerNumbers: [],
    opponentNumbers: [],
    guesses: [],
    opponentGuesses: [],
    timeLeft: 60,
    timerInterval: null
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
        result: document.getElementById('result-screen')
    },
    
    // Mostrar uma tela e esconder as outras
    showScreen(screenId) {
        for (const id in this.screens) {
            if (id === screenId) {
                this.screens[id].classList.add('active');
                
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
                this.screens[id].classList.remove('active');
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
  });