// Funções relacionadas ao ranking de jogadores
const Ranking = {
  // Elementos da interface
  elements: {
      rankingBtn: document.getElementById('ranking-btn'),
      rankingDisplay: document.getElementById('ranking-display'),
      rankingList: document.getElementById('ranking-list')
  },
  
  // Inicializar ranking
  init() {
      // Event listeners
      this.setupEventListeners();
  },
  
  // Configurar os event listeners
  setupEventListeners() {
      const elements = this.elements;
      
      // Botão de ver ranking
      elements.rankingBtn.addEventListener('click', () => {
          if (elements.rankingDisplay.style.display === 'none') {
              this.displayRanking();
              elements.rankingDisplay.style.display = 'block';
              elements.rankingBtn.textContent = 'Esconder Ranking';
          } else {
              elements.rankingDisplay.style.display = 'none';
              elements.rankingBtn.textContent = 'Ver Ranking';
          }
      });
  },
  
  // Exibir o ranking
  displayRanking() {
      const ranking = DB.getRanking();
      this.elements.rankingList.innerHTML = '';
      
      if (ranking.length === 0) {
          this.elements.rankingList.innerHTML = '<p>Nenhum jogador no ranking ainda.</p>';
          return;
      }
      
      // Criar cards para cada jogador
      ranking.forEach((player, index) => {
          const card = document.createElement('div');
          card.className = 'player-card';
          
          // Posição
          const position = document.createElement('div');
          position.style.fontWeight = 'bold';
          position.style.marginRight = '10px';
          position.textContent = `${index + 1}.`;
          
          // Foto de perfil
          const profilePic = document.createElement('div');
          profilePic.className = 'profile-pic';
          
          if (player.profilePic) {
              const img = document.createElement('img');
              img.src = player.profilePic;
              img.alt = player.firstName;
              profilePic.appendChild(img);
          } else {
              // Usar inicial do nome
              const initial = document.createElement('div');
              initial.className = 'profile-pic-initial';
              initial.textContent = player.firstName.charAt(0).toUpperCase();
              profilePic.appendChild(initial);
          }
          
          // Informações do jogador
          const info = document.createElement('div');
          info.className = 'player-info';
          
          const name = document.createElement('div');
          name.style.fontWeight = 'bold';
          name.textContent = `${player.firstName} ${player.lastName}`;
          
          const username = document.createElement('div');
          username.style.color = '#666';
          username.style.fontSize = '14px';
          username.textContent = `@${player.username}`;
          
          info.appendChild(name);
          info.appendChild(username);
          
          // Vitórias
          const wins = document.createElement('div');
          wins.style.marginLeft = 'auto';
          wins.style.fontWeight = 'bold';
          wins.textContent = `${player.wins} ${player.wins === 1 ? 'vitória' : 'vitórias'}`;
          
          // Montar o card
          card.appendChild(position);
          card.appendChild(profilePic);
          card.appendChild(info);
          card.appendChild(wins);
          
          // Adicionar à lista
          this.elements.rankingList.appendChild(card);
      });
  }
};