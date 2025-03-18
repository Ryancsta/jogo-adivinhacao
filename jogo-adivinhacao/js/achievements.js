// Sistema de conquistas para o jogo
const Achievements = {
  // Lista de todas as conquistas disponíveis
  achievementsList: [
      {
          id: 'first_game',
          title: 'Primeiro Jogo',
          description: 'Complete sua primeira partida.',
          icon: '🎮',
          unlocked: false,
          secret: false,
          points: 10
      },
      {
          id: 'first_win',
          title: 'Primeira Vitória',
          description: 'Vença sua primeira partida.',
          icon: '🏆',
          unlocked: false,
          secret: false,
          points: 20
      },
      {
          id: 'speedster',
          title: 'Velocista',
          description: 'Vença uma partida em menos de 5 tentativas.',
          icon: '⚡',
          unlocked: false,
          secret: false,
          points: 30
      },
      {
          id: 'strategist',
          title: 'Estrategista',
          description: 'Vença sem que o oponente acerte nenhum número.',
          icon: '🧠',
          unlocked: false,
          secret: false,
          points: 40
      },
      {
          id: 'expert',
          title: 'Especialista',
          description: 'Vença 10 jogos.',
          icon: '🎯',
          unlocked: false,
          secret: false,
          points: 50
      },
      {
          id: 'master',
          title: 'Mestre',
          description: 'Vença 25 jogos.',
          icon: '👑',
          unlocked: false,
          secret: false,
          points: 75
      },
      {
          id: 'perfect_game',
          title: 'Jogo Perfeito',
          description: 'Acerte os números do oponente na primeira tentativa.',
          icon: '🌟',
          unlocked: false,
          secret: true,
          points: 100
      },
      {
          id: 'persistent',
          title: 'Persistente',
          description: 'Jogue 50 partidas.',
          icon: '🔄',
          unlocked: false,
          secret: false,
          points: 30
      },
      {
          id: 'chatty',
          title: 'Comunicativo',
          description: 'Envie 20 mensagens no chat durante as partidas.',
          icon: '💬',
          unlocked: false,
          secret: false,
          points: 15
      },
      {
          id: 'comeback',
          title: 'Virada',
          description: 'Vença uma partida quando o oponente já tem 2 dos seus números.',
          icon: '🔄',
          unlocked: false,
          secret: true,
          points: 60
      }
  ],
  
  // Elementos da interface
  elements: {
      achievementsButton: null,
      achievementsModal: null,
      achievementsList: null,
      closeButton: null,
      totalPoints: null,
      achievementNotification: null
  },
  
  // Inicializar o sistema de conquistas
  init() {
      // Carregar conquistas do localStorage
      this.loadAchievements();
      
      // Criar elementos da interface
      this.createUI();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      console.log("Sistema de conquistas inicializado");
  },
  
  // Carregar conquistas salvas
  loadAchievements() {
      try {
          if (gameState.currentUser && gameState.currentUser.id) {
              const userId = gameState.currentUser.id;
              const key = `gameAchievements_${userId}`;
              
              // Tentar carregar conquistas específicas do usuário
              const savedAchievements = localStorage.getItem(key);
              
              if (savedAchievements) {
                  const parsed = JSON.parse(savedAchievements);
                  
                  // Atualizar o estado de cada conquista
                  this.achievementsList.forEach((achievement, index) => {
                      if (parsed[achievement.id]) {
                          this.achievementsList[index].unlocked = true;
                      } else {
                          this.achievementsList[index].unlocked = false;
                      }
                  });
                  return;
              }
          }
          
          // Fallback para o localStorage global (para retrocompatibilidade)
          const savedAchievements = localStorage.getItem('gameAchievements');
          if (savedAchievements) {
              const parsed = JSON.parse(savedAchievements);
              
              // Atualizar o estado de cada conquista
              this.achievementsList.forEach((achievement, index) => {
                  if (parsed[achievement.id]) {
                      this.achievementsList[index].unlocked = true;
                  }
              });
          }
      } catch (error) {
          console.log("Erro ao carregar conquistas:", error);
      }
  },
  
  // Salvar conquistas no localStorage
  saveAchievements() {
      try {
          // Associar conquistas ao ID do jogador atual
          if (gameState.currentUser && gameState.currentUser.id) {
              const userId = gameState.currentUser.id;
              const key = `gameAchievements_${userId}`;
              
              const saveData = {};
              this.achievementsList.forEach(achievement => {
                  saveData[achievement.id] = achievement.unlocked;
              });
              
              localStorage.setItem(key, JSON.stringify(saveData));
              
              // Também salvar no localStorage global (para retrocompatibilidade)
              localStorage.setItem('gameAchievements', JSON.stringify(saveData));
          }
      } catch (error) {
          console.log("Erro ao salvar conquistas:", error);
      }
  },
  
  // Criar elementos da interface
  createUI() {
      // Adicionar botão no menu
      const menuScreen = document.getElementById('menu-screen');
      if (!menuScreen) return;
      
      // Botão de conquistas no menu
      const achievementsButton = document.createElement('button');
      achievementsButton.id = 'achievements-btn';
      achievementsButton.className = 'btn';
      achievementsButton.textContent = 'Conquistas';
      
      // Inserir o botão após o botão de perfil
      const profileBtn = document.getElementById('profile-btn');
      if (profileBtn && profileBtn.parentNode) {
          profileBtn.parentNode.insertBefore(achievementsButton, profileBtn.nextSibling);
      } else {
          menuScreen.appendChild(achievementsButton);
      }
      
      // Modal de conquistas
      const achievementsModal = document.createElement('div');
      achievementsModal.id = 'achievements-modal';
      achievementsModal.className = 'modal';
      
      // Conteúdo do modal
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content achievements-modal-content';
      
      // Cabeçalho
      const modalHeader = document.createElement('div');
      modalHeader.className = 'achievements-header';
      modalHeader.innerHTML = '<h3>Conquistas</h3>';
      
      // Botão para fechar
      const closeButton = document.createElement('button');
      closeButton.className = 'close-btn';
      closeButton.innerHTML = '&times;';
      modalHeader.appendChild(closeButton);
      
      // Contador de pontos
      const pointsCounter = document.createElement('div');
      pointsCounter.className = 'points-counter';
      pointsCounter.innerHTML = '<span>Pontos totais: <span id="total-achievement-points">0</span></span>';
      
      // Lista de conquistas
      const achievementsList = document.createElement('div');
      achievementsList.className = 'achievements-list';
      
      // Montar modal
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(pointsCounter);
      modalContent.appendChild(achievementsList);
      achievementsModal.appendChild(modalContent);
      
      // Notificação de conquista
      const achievementNotification = document.createElement('div');
      achievementNotification.id = 'achievement-notification';
      achievementNotification.className = 'achievement-notification';
      achievementNotification.style.display = 'none';
      
      // Adicionar ao DOM
      document.body.appendChild(achievementsModal);
      document.body.appendChild(achievementNotification);
      
      // Salvar referências
      this.elements.achievementsButton = achievementsButton;
      this.elements.achievementsModal = achievementsModal;
      this.elements.achievementsList = achievementsList;
      this.elements.closeButton = closeButton;
      this.elements.totalPoints = document.getElementById('total-achievement-points');
      this.elements.achievementNotification = achievementNotification;
  },
  
  // Configurar event listeners
  setupEventListeners() {
      const elements = this.elements;
      
      // Botão de conquistas
      if (elements.achievementsButton) {
          elements.achievementsButton.addEventListener('click', () => {
              this.showAchievements();
          });
      }
      
      // Botão de fechar
      if (elements.closeButton) {
          elements.closeButton.addEventListener('click', () => {
              elements.achievementsModal.style.display = 'none';
          });
      }
      
      // Fechar ao clicar fora do modal
      if (elements.achievementsModal) {
          elements.achievementsModal.addEventListener('click', (e) => {
              if (e.target === elements.achievementsModal) {
                  elements.achievementsModal.style.display = 'none';
              }
          });
      }
  },
  
  // Mostrar modal de conquistas
  showAchievements() {
      const elements = this.elements;
      
      // Limpar lista
      if (elements.achievementsList) {
          elements.achievementsList.innerHTML = '';
          
          // Preencher com conquistas
          this.achievementsList.forEach(achievement => {
              const achievementCard = document.createElement('div');
              achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
              
              // Título e ícone
              const title = document.createElement('div');
              title.className = 'achievement-title';
              
              const icon = document.createElement('span');
              icon.className = 'achievement-icon';
              icon.textContent = achievement.unlocked ? achievement.icon : '🔒';
              
              const name = document.createElement('span');
              name.textContent = achievement.title;
              
              title.appendChild(icon);
              title.appendChild(name);
              
              // Descrição
              const description = document.createElement('div');
              description.className = 'achievement-description';
              
              // Se for secreta e não desbloqueada, ocultar descrição
              if (achievement.secret && !achievement.unlocked) {
                  description.textContent = '???';
              } else {
                  description.textContent = achievement.description;
              }
              
              // Pontos
              const points = document.createElement('div');
              points.className = 'achievement-points';
              points.textContent = `${achievement.points} pts`;
              
              // Montar card
              achievementCard.appendChild(title);
              achievementCard.appendChild(description);
              achievementCard.appendChild(points);
              
              // Adicionar à lista
              elements.achievementsList.appendChild(achievementCard);
          });
          
          // Atualizar total de pontos
          let totalPoints = 0;
          this.achievementsList.forEach(achievement => {
              if (achievement.unlocked) {
                  totalPoints += achievement.points;
              }
          });
          
          if (elements.totalPoints) {
              elements.totalPoints.textContent = totalPoints;
          }
      }
      
      // Mostrar modal
      if (elements.achievementsModal) {
          elements.achievementsModal.style.display = 'flex';
      }
  },
  
  // Verificar e desbloquear conquistas com base no estado atual do jogo
  checkAchievements(gameState) {
      let newAchievements = [];
      const currentUser = gameState.currentUser;
      
      if (!currentUser || !currentUser.stats) return newAchievements;
      
      // Primeira partida
      if (currentUser.stats.gamesPlayed >= 1) {
          newAchievements = this.unlockAchievement('first_game', newAchievements);
      }
      
      // Primeira vitória
      if (currentUser.stats.wins >= 1) {
          newAchievements = this.unlockAchievement('first_win', newAchievements);
      }
      
      // Especialista
      if (currentUser.stats.wins >= 10) {
          newAchievements = this.unlockAchievement('expert', newAchievements);
      }
      
      // Mestre
      if (currentUser.stats.wins >= 25) {
          newAchievements = this.unlockAchievement('master', newAchievements);
      }
      
      // Persistente
      if (currentUser.stats.gamesPlayed >= 50) {
          newAchievements = this.unlockAchievement('persistent', newAchievements);
      }
      
      // Conquistas baseadas na partida atual
      if (gameState.lastGameStats) {
          // Velocista
          if (gameState.lastGameStats.playerWon && gameState.lastGameStats.attempts < 5) {
              newAchievements = this.unlockAchievement('speedster', newAchievements);
          }
          
          // Jogo Perfeito
          if (gameState.lastGameStats.playerWon && gameState.lastGameStats.attempts === 1) {
              newAchievements = this.unlockAchievement('perfect_game', newAchievements);
          }
          
          // Estrategista
          if (gameState.lastGameStats.playerWon && gameState.lastGameStats.maxOpponentHits === 0) {
              newAchievements = this.unlockAchievement('strategist', newAchievements);
          }
          
          // Virada
          if (gameState.lastGameStats.playerWon && gameState.lastGameStats.maxOpponentHits >= 2) {
              newAchievements = this.unlockAchievement('comeback', newAchievements);
          }
      }
      
      // Comunicativo
      if (gameState.chatMessages && gameState.chatMessages >= 20) {
          newAchievements = this.unlockAchievement('chatty', newAchievements);
      }
      
      // Salvar conquistas se houve alguma nova
      if (newAchievements.length > 0) {
          this.saveAchievements();
          
          // Mostrar notificações
          this.showAchievementNotifications(newAchievements);
      }
      
      return newAchievements;
  },
  
  // Desbloquear uma conquista específica
  unlockAchievement(achievementId, newAchievements) {
      const achievementIndex = this.achievementsList.findIndex(a => a.id === achievementId);
      
      if (achievementIndex !== -1 && !this.achievementsList[achievementIndex].unlocked) {
          this.achievementsList[achievementIndex].unlocked = true;
          newAchievements.push(this.achievementsList[achievementIndex]);
          
          // Tocar som se disponível
          if (typeof Audio !== 'undefined' && Audio.play) {
              Audio.play('victory');
          }
      }
      
      return newAchievements;
  },
  
  // Mostrar notificações para novas conquistas
  showAchievementNotifications(achievements) {
      if (!achievements || achievements.length === 0) return;
      
      const notification = this.elements.achievementNotification;
      if (!notification) return;
      
      // Mostrar notificações em sequência
      let delay = 0;
      
      achievements.forEach(achievement => {
          setTimeout(() => {
              notification.innerHTML = `
                  <div class="achievement-notification-content">
                      <div class="achievement-notification-icon">${achievement.icon}</div>
                      <div class="achievement-notification-text">
                          <div class="achievement-notification-title">Nova Conquista!</div>
                          <div class="achievement-notification-name">${achievement.title}</div>
                          <div class="achievement-notification-points">+${achievement.points} pts</div>
                      </div>
                  </div>
              `;
              
              // Mostrar notificação
              notification.style.display = 'block';
              notification.classList.add('show');
              
              // Esconder após alguns segundos
              setTimeout(() => {
                  notification.classList.remove('show');
                  setTimeout(() => {
                      notification.style.display = 'none';
                  }, 500);
              }, 3000);
          }, delay);
          
          delay += 3500; // Mostrar próxima notificação após um intervalo
      });
  },
  
  // Registrar estatísticas de fim de jogo para verificação de conquistas
  registerGameEnd(playerWon, attempts, opponentGuesses) {
      // Determinar o máximo de acertos do oponente
      let maxOpponentHits = 0;
      if (opponentGuesses && opponentGuesses.length > 0) {
          opponentGuesses.forEach(guess => {
              if (guess.hits > maxOpponentHits) {
                  maxOpponentHits = guess.hits;
              }
          });
      }
      
      // Salvar estatísticas da última partida
      gameState.lastGameStats = {
          playerWon,
          attempts,
          maxOpponentHits
      };
      
      // Verificar conquistas
      return this.checkAchievements(gameState);
  },
  
  // Registrar mensagem enviada no chat
  registerChatMessage() {
      // Incrementar contador de mensagens
      if (!gameState.chatMessages) {
          gameState.chatMessages = 0;
      }
      gameState.chatMessages++;
      
      // Verificar conquista a cada 5 mensagens
      if (gameState.chatMessages % 5 === 0) {
          this.checkAchievements(gameState);
      }
  }
};