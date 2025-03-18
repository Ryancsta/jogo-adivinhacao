// Funções relacionadas ao ranking de jogadores
const Ranking = {
    // Elementos da interface
    elements: {
        rankingBtn: document.getElementById('ranking-btn'),
        rankingDisplay: document.getElementById('ranking-display'),
        rankingList: document.getElementById('ranking-list'),
        
        // Novos elementos para ranking duplo
        rankingTabs: null,
        winsTab: null,
        achievementsTab: null,
        winsRankingList: null,
        achievementsRankingList: null
    },
    
    // Inicializar ranking
    init() {
        // Criar a interface de abas
        this.createTabInterface();
        
        // Event listeners
        this.setupEventListeners();
    },
    
    // Criar a interface de abas do ranking
    createTabInterface() {
        const rankingDisplay = this.elements.rankingDisplay;
        if (!rankingDisplay) return;
        
        // Limpar conteúdo existente
        rankingDisplay.innerHTML = '';
        
        // Título do ranking
        const rankingTitle = document.createElement('h3');
        rankingTitle.textContent = 'Ranking de Jogadores';
        rankingDisplay.appendChild(rankingTitle);
        
        // Abas
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'ranking-tabs';
        
        // Aba de vitórias
        const winsTab = document.createElement('button');
        winsTab.className = 'ranking-tab active';
        winsTab.textContent = 'Vitórias';
        winsTab.dataset.tab = 'wins';
        
        // Aba de conquistas
        const achievementsTab = document.createElement('button');
        achievementsTab.className = 'ranking-tab';
        achievementsTab.textContent = 'Conquistas';
        achievementsTab.dataset.tab = 'achievements';
        
        // Adicionar abas ao container
        tabsContainer.appendChild(winsTab);
        tabsContainer.appendChild(achievementsTab);
        rankingDisplay.appendChild(tabsContainer);
        
        // Container para lista de vitórias
        const winsContainer = document.createElement('div');
        winsContainer.className = 'ranking-content active';
        winsContainer.id = 'wins-ranking';
        
        // Lista para ranking de vitórias
        const winsRankingList = document.createElement('div');
        winsRankingList.className = 'ranking-list wins-list';
        winsContainer.appendChild(winsRankingList);
        
        // Container para lista de conquistas
        const achievementsContainer = document.createElement('div');
        achievementsContainer.className = 'ranking-content';
        achievementsContainer.id = 'achievements-ranking';
        achievementsContainer.style.display = 'none';
        
        // Lista para ranking de conquistas
        const achievementsRankingList = document.createElement('div');
        achievementsRankingList.className = 'ranking-list achievements-list';
        achievementsContainer.appendChild(achievementsRankingList);
        
        // Adicionar listas ao display
        rankingDisplay.appendChild(winsContainer);
        rankingDisplay.appendChild(achievementsContainer);
        
        // Salvar referências
        this.elements.rankingTabs = tabsContainer;
        this.elements.winsTab = winsTab;
        this.elements.achievementsTab = achievementsTab;
        this.elements.winsRankingList = winsRankingList;
        this.elements.achievementsRankingList = achievementsRankingList;
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
        
        // Event listener para as abas
        if (elements.rankingTabs) {
            elements.rankingTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.ranking-tab');
                if (!tab) return;
                
                // Remover classe ativa de todas as abas
                const tabs = elements.rankingTabs.querySelectorAll('.ranking-tab');
                tabs.forEach(t => t.classList.remove('active'));
                
                // Adicionar classe ativa à aba clicada
                tab.classList.add('active');
                
                // Mostrar conteúdo correspondente
                const tabName = tab.dataset.tab;
                const contents = document.querySelectorAll('.ranking-content');
                contents.forEach(c => c.style.display = 'none');
                
                if (tabName === 'wins') {
                    document.getElementById('wins-ranking').style.display = 'block';
                } else if (tabName === 'achievements') {
                    document.getElementById('achievements-ranking').style.display = 'block';
                }
            });
        }
    },
    
    // Exibir o ranking
    displayRanking() {
        // Exibir ranking de vitórias
        this.displayWinsRanking();
        
        // Exibir ranking de conquistas
        this.displayAchievementsRanking();
    },
    
    // Exibir o ranking de vitórias
    displayWinsRanking() {
        const winsRankingList = this.elements.winsRankingList;
        if (!winsRankingList) return;
        
        // Limpar lista
        winsRankingList.innerHTML = '';
        
        // Obter ranking por vitórias
        const ranking = DB.getRanking();
        
        if (ranking.length === 0) {
            winsRankingList.innerHTML = '<p>Nenhum jogador no ranking ainda.</p>';
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
            winsRankingList.appendChild(card);
        });
    },
    
    // Exibir o ranking de conquistas
    displayAchievementsRanking() {
        const achievementsRankingList = this.elements.achievementsRankingList;
        if (!achievementsRankingList || typeof Achievements === 'undefined') return;
        
        // Limpar lista
        achievementsRankingList.innerHTML = '';
        
        // Obter dados de todos os jogadores
        const players = DB.getPlayers();
        
        if (players.length === 0) {
            achievementsRankingList.innerHTML = '<p>Nenhum jogador no ranking ainda.</p>';
            return;
        }
        
        // Calcular pontos de conquistas para cada jogador
        const rankingData = players.map(player => {
            // Obter conquistas do jogador
            const achievements = this.getPlayerAchievements(player.id);
            
            // Calcular total de pontos
            let totalPoints = 0;
            let achievementsCount = 0;
            
            if (achievements) {
                // Percorrer as conquistas e contar as desbloqueadas
                Achievements.achievementsList.forEach(achievement => {
                    if (achievements[achievement.id]) {
                        totalPoints += achievement.points;
                        achievementsCount++;
                    }
                });
            }
            
            return {
                id: player.id,
                username: player.username,
                firstName: player.firstName,
                lastName: player.lastName,
                profilePic: player.profilePic,
                achievementsCount: achievementsCount,
                achievementPoints: totalPoints
            };
        });
        
        // Ordenar por pontos de conquistas (maior primeiro)
        rankingData.sort((a, b) => b.achievementPoints - a.achievementPoints);
        
        // Criar cards para cada jogador
        rankingData.forEach((player, index) => {
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
            
            // Conquistas
            const achievements = document.createElement('div');
            achievements.style.marginLeft = 'auto';
            achievements.style.fontWeight = 'bold';
            achievements.style.textAlign = 'right';
            
            // Pontos
            const points = document.createElement('div');
            points.textContent = `${player.achievementPoints} pontos`;
            points.style.color = '#4CAF50';
            
            // Número de conquistas
            const count = document.createElement('div');
            count.textContent = `${player.achievementsCount} ${player.achievementsCount === 1 ? 'conquista' : 'conquistas'}`;
            count.style.fontSize = '12px';
            count.style.color = '#666';
            
            achievements.appendChild(points);
            achievements.appendChild(count);
            
            // Montar o card
            card.appendChild(position);
            card.appendChild(profilePic);
            card.appendChild(info);
            card.appendChild(achievements);
            
            // Adicionar à lista
            achievementsRankingList.appendChild(card);
        });
    },
    
    // Obter conquistas de um jogador específico
    getPlayerAchievements(playerId) {
        try {
            // Obter conquistas do localStorage
            const key = `gameAchievements_${playerId}`;
            const savedAchievements = localStorage.getItem(key);
            if (savedAchievements) {
                return JSON.parse(savedAchievements);
            }
        } catch (error) {
            console.log("Erro ao obter conquistas do jogador:", error);
        }
        
        return null;
    }
  };