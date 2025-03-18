// Banco de dados local (simulando um servidor)
const DB = {
    users: [], // Lista de usuários
    sessions: {}, // Sessões ativas
    
    // Inicializar o banco de dados a partir do localStorage
    init() {
        try {
            const savedUsers = localStorage.getItem('gameUsers');
            if (savedUsers) {
                this.users = JSON.parse(savedUsers);
            }
        } catch (error) {
            console.log("Erro ao carregar usuários:", error);
        }
    },
    
    // Salvar banco de dados no localStorage
    save() {
        try {
            localStorage.setItem('gameUsers', JSON.stringify(this.users));
        } catch (error) {
            console.log("Erro ao salvar usuários:", error);
        }
    },
    
    // Criar um novo usuário
    createUser(userData) {
        // Verificar se o nome de usuário já existe
        if (this.users.some(u => u.username === userData.username)) {
            return { success: false, message: "Nome de usuário já existe!" };
        }
        
        // Criar novo usuário
        const newUser = {
            id: Date.now().toString(), // ID único baseado em timestamp
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username,
            password: userData.password, // Nota: em um sistema real, a senha seria criptografada
            profilePic: userData.profilePic || '',
            stats: {
                wins: 0,
                gamesPlayed: 0
            }
        };
        
        // Adicionar ao banco de dados
        this.users.push(newUser);
        this.save();
        
        return { success: true, user: { ...newUser, password: undefined } }; // Retornar sem a senha
    },
    
    // Autenticar usuário
    login(username, password) {
        const user = this.users.find(u => u.username === username);
        
        if (!user || user.password !== password) {
            return { success: false, message: "Nome de usuário ou senha incorretos!" };
        }
        
        // Criar sessão
        const sessionId = Date.now().toString();
        this.sessions[sessionId] = user.id;
        
        return { 
            success: true, 
            sessionId, 
            user: { ...user, password: undefined } // Retornar sem a senha
        };
    },
    
    // Verificar sessão
    checkSession(sessionId) {
        const userId = this.sessions[sessionId];
        if (!userId) return null;
        
        const user = this.users.find(u => u.id === userId);
        if (!user) return null;
        
        return { ...user, password: undefined }; // Retornar sem a senha
    },
    
    // Encerrar sessão
    logout(sessionId) {
        delete this.sessions[sessionId];
    },
    
    // Atualizar perfil de usuário
    updateProfile(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) return false;
        
        // Atualizar campos permitidos
        if (updates.profilePic !== undefined) {
            this.users[userIndex].profilePic = updates.profilePic;
        }
        
        this.save();
        return true;
    },
    
    // Atualizar estatísticas do usuário
    updateStats(userId, won) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) return false;
        
        this.users[userIndex].stats.gamesPlayed++;
        if (won) {
            this.users[userIndex].stats.wins++;
        }
        
        this.save();
        return true;
    },
    
    // Obter ranking de jogadores
    getRanking() {
        return this.users
            .map(u => ({
                id: u.id,
                username: u.username,
                firstName: u.firstName,
                lastName: u.lastName,
                profilePic: u.profilePic,
                wins: u.stats.wins
            }))
            .sort((a, b) => b.wins - a.wins);
    },
    
    // Obter todos os jogadores
    getPlayers() {
        return this.users.map(u => ({
            id: u.id,
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            profilePic: u.profilePic,
            stats: u.stats
        }));
    }
  };