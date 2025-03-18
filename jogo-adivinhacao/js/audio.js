// Sistema de áudio com suporte a música de fundo
const Audio = {
    // Cache de sons ativos
    activeSounds: {},
    
    // Registro de quando cada som foi tocado pela última vez
    lastPlayed: {},
    
    // Rastreamento da música de fundo atual
    backgroundMusic: null,
    
    // Estado de mudo
    muted: false,
    
    // Mapeamento dos nomes de som para arquivos
    soundMap: {
      // Efeitos sonoros
      'buttonClick': 'button-click.mp3',
      'correctGuess': 'correct-guess.mp3',
      'wrongGuess': 'wrong-guess.mp3',
      'victory': 'victory.mp3',
      'defeat': 'defeat.mp3',
      'tick': 'tick.mp3',
      'timesUp': 'times-up.mp3',
      'login': 'login.mp3',
      'register': 'register.mp3',
      //'notification': 'notification.mp3',
      
      // Músicas de fundo
      'menuMusic': 'menu-music.mp3',
      'gameMusic': 'game-music.mp3'
    },
    
    // Configurações de prioridade de som (maior = maior prioridade)
    soundPriority: {
      'buttonClick': 10,
      'correctGuess': 50,
      'wrongGuess': 50,
      'victory': 100,
      'defeat': 100,
      'tick': 5,
      'timesUp': 80,
      'login': 90,
      'register': 90,
      'notification': 60
    },
    
    // Configurações de intervalo mínimo entre reproduções (em ms)
    soundCooldown: {
      'buttonClick': 100,
      'correctGuess': 500,
      'wrongGuess': 500,
      'victory': 0,
      'defeat': 0,
      'tick': 300,
      'timesUp': 0,
      'login': 0,
      'register': 0,
      'notification': 500
    },
    
    // Inicializar o módulo de áudio
    init: function() {
      console.log("Sistema de áudio com música de fundo inicializado");
      
      // Carregar configuração de mudo do localStorage
      const savedMute = localStorage.getItem('gameMuted');
      if (savedMute !== null) {
        this.muted = savedMute === 'true';
      }
      
      // Adicionar botão de controle de som ao cabeçalho
      this.createAudioControls();
    },
    
    // Criar controles de áudio na interface
    createAudioControls: function() {
      const header = document.querySelector('.container.header') || document.body;
      
      // Criar o botão
      const muteBtn = document.createElement('button');
      muteBtn.id = 'mute-btn';
      muteBtn.className = 'mute-btn';
      muteBtn.innerHTML = this.muted ? '🔇' : '🔊';
      muteBtn.title = this.muted ? 'Ativar sons' : 'Desativar sons';
      
      // Estilizar o botão
      muteBtn.style.background = 'none';
      muteBtn.style.border = 'none';
      muteBtn.style.fontSize = '24px';
      muteBtn.style.cursor = 'pointer';
      muteBtn.style.marginLeft = '10px';
      
      // Adicionar evento de clique
      muteBtn.addEventListener('click', () => {
        this.toggleMute();
        muteBtn.innerHTML = this.muted ? '🔇' : '🔊';
        muteBtn.title = this.muted ? 'Ativar sons' : 'Desativar sons';
      });
      
      // Adicionar à interface
      header.appendChild(muteBtn);
    },
    
    // Alternar entre mudo/som
    toggleMute: function() {
      this.muted = !this.muted;
      localStorage.setItem('gameMuted', this.muted);
      console.log(`Áudio ${this.muted ? 'silenciado' : 'ativado'}`);
      
      // Atualizar volume da música de fundo
      if (this.backgroundMusic) {
        this.backgroundMusic.volume = this.muted ? 0 : 0.2;
      }
    },
    
    // Reproduzir um som
    play: function(soundName) {
      // Verificar se está mudo
      if (this.muted) {
        return;
      }
      
      // Verificar se o som existe no mapa
      if (!this.soundMap[soundName]) {
        console.log(`Som ${soundName} não encontrado`);
        return;
      }
      
      // Verificar cooldown - não tocar se for muito cedo
      const now = Date.now();
      const lastPlayed = this.lastPlayed[soundName] || 0;
      const cooldown = this.soundCooldown[soundName] || 0;
      
      if (now - lastPlayed < cooldown) {
        console.log(`Som ${soundName} em cooldown. Ignorando.`);
        return;
      }
      
      // Verificar prioridade - não tocar se houver outro som de maior prioridade
      const currentPriority = this.soundPriority[soundName] || 0;
      let canPlay = true;
      
      for (const activeSound in this.activeSounds) {
        const activePriority = this.soundPriority[activeSound] || 0;
        
        // Se for um som de prioridade mais alta que está tocando, não interrompa
        if (activePriority > currentPriority && activeSound !== soundName) {
          console.log(`Som ${soundName} bloqueado por ${activeSound} (prioridade maior)`);
          canPlay = false;
          break;
        }
        
        // Se for o mesmo som, pare a instância anterior
        if (activeSound === soundName) {
          this.stop(activeSound);
        }
      }
      
      if (!canPlay) return;
      
      // Tocar o som
      try {
        const sound = new window.Audio(`sounds/${this.soundMap[soundName]}`);
        sound.volume = 0.5;
        
        // Registrar quando o som começou
        this.lastPlayed[soundName] = now;
        
        // Rastrear o som ativo
        this.activeSounds[soundName] = sound;
        
        // Configurar evento para limpar quando o som terminar
        sound.onended = () => {
          delete this.activeSounds[soundName];
        };
        
        // Iniciar reprodução
        sound.play().catch(error => {
          console.log(`Erro ao tocar som ${soundName}:`, error);
          delete this.activeSounds[soundName];
        });
      } catch (error) {
        console.log(`Erro ao criar som ${soundName}:`, error);
      }
    },
    
    // Parar um som específico
    stop: function(soundName) {
      if (this.activeSounds[soundName]) {
        try {
          this.activeSounds[soundName].pause();
          this.activeSounds[soundName].currentTime = 0;
          delete this.activeSounds[soundName];
        } catch (error) {
          console.log(`Erro ao parar som ${soundName}:`, error);
        }
      }
    },
    
    // Parar todos os sons
    stopAll: function() {
      for (const soundName in this.activeSounds) {
        this.stop(soundName);
      }
    },
    
    // Iniciar música de fundo
    playBackgroundMusic: function(musicName) {
      // Verificar se a música existe
      if (!this.soundMap[musicName]) {
        console.log(`Música ${musicName} não encontrada`);
        return;
      }
      
      // Parar música atual se existir
      this.stopBackgroundMusic();
      
      try {
        // Criar novo elemento de áudio para a música
        this.backgroundMusic = new window.Audio(`sounds/${this.soundMap[musicName]}`);
        this.backgroundMusic.loop = true;  // Reprodução em loop
        this.backgroundMusic.volume = this.muted ? 0 : 0.2;  // Volume mais baixo para música de fundo
        
        // Começar a reprodução
        this.backgroundMusic.play().catch(error => {
          console.log(`Erro ao tocar música de fundo ${musicName}:`, error);
          this.backgroundMusic = null;
        });
      } catch (error) {
        console.log(`Erro ao criar música de fundo ${musicName}:`, error);
      }
    },
    
    // Parar música de fundo
    stopBackgroundMusic: function() {
      if (this.backgroundMusic) {
        try {
          this.backgroundMusic.pause();
          this.backgroundMusic.currentTime = 0;
          this.backgroundMusic = null;
        } catch (error) {
          console.log('Erro ao parar música de fundo:', error);
        }
      }
    }
  };