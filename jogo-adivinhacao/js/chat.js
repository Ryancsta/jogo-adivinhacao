// Sistema de chat para o jogo
const Chat = {
    // Elementos da interface
    elements: {
        chatContainer: null,
        chatMessages: null,
        chatInput: null,
        chatSendBtn: null,
        chatToggleBtn: null
    },
    
    // Mensagens predefinidas para o oponente IA
    aiResponses: [
        "Estou pensando nos seus números...",
        "Hmm, será que acertei algum?",
        "Essa rodada está difícil!",
        "Tenho certeza que vou ganhar!",
        "Você parece bom nisso!",
        "Quase consegui todos os seus números.",
        "Seus palpites estão próximos?",
        "Estou começando a entender seu padrão.",
        "Vamos ver quem vai ganhar!",
        "Boa sorte na sua próxima tentativa!"
    ],
    
    // Estado do chat
    isMinimized: false,
    messageHistory: [],
    
    // Inicializar o chat
    init() {
        // Criar elementos do chat e adicionar ao DOM
        this.createChatElements();
        
        // Configurar listeners de eventos
        this.setupEventListeners();
        
        console.log("Sistema de chat inicializado");
    },
    
    // Criar elementos do chat
    createChatElements() {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen) return;
        
        // Criar container do chat
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chat-container';
        chatContainer.className = 'chat-container';
        
        // Criar cabeçalho do chat
        const chatHeader = document.createElement('div');
        chatHeader.className = 'chat-header';
        chatHeader.innerHTML = '<span>Chat com Oponente</span>';
        
        // Botão para minimizar/maximizar
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'chat-toggle-btn';
        toggleBtn.textContent = '−';
        toggleBtn.title = 'Minimizar chat';
        chatHeader.appendChild(toggleBtn);
        
        // Área de mensagens
        const chatMessages = document.createElement('div');
        chatMessages.className = 'chat-messages';
        
        // Área de entrada
        const chatInputArea = document.createElement('div');
        chatInputArea.className = 'chat-input-area';
        
        const chatInput = document.createElement('input');
        chatInput.type = 'text';
        chatInput.className = 'chat-input';
        chatInput.placeholder = 'Digite sua mensagem...';
        
        const chatSendBtn = document.createElement('button');
        chatSendBtn.className = 'chat-send-btn';
        chatSendBtn.textContent = 'Enviar';
        
        chatInputArea.appendChild(chatInput);
        chatInputArea.appendChild(chatSendBtn);
        
        // Montar o container
        chatContainer.appendChild(chatHeader);
        chatContainer.appendChild(chatMessages);
        chatContainer.appendChild(chatInputArea);
        
        // Adicionar ao DOM
        gameScreen.appendChild(chatContainer);
        
        // Salvar referências
        this.elements.chatContainer = chatContainer;
        this.elements.chatMessages = chatMessages;
        this.elements.chatInput = chatInput;
        this.elements.chatSendBtn = chatSendBtn;
        this.elements.chatToggleBtn = toggleBtn;
        
        // Adicionar mensagem de boas-vindas
        this.addSystemMessage("Chat iniciado. Você pode conversar com seu oponente durante o jogo!");
        
        // Mensagem inicial do oponente
        setTimeout(() => {
            // Verificar se estamos no modo online ou offline
            if (Game.gameMode === 'online') {
                // No modo online, não mostrar mensagem automática inicial
            } else {
                // No modo offline, mostrar mensagem automática
                this.addOpponentMessage("Olá! Vamos ver quem consegue adivinhar os números primeiro!");
            }
        }, 1000);
    },
    
    // Configurar event listeners
    setupEventListeners() {
        const elements = this.elements;
        if (!elements.chatSendBtn || !elements.chatInput || !elements.chatToggleBtn) return;
        
        // Enviar mensagem ao clicar no botão
        elements.chatSendBtn.addEventListener('click', () => {
            this.sendPlayerMessage();
        });
        
        // Enviar mensagem ao pressionar Enter
        elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendPlayerMessage();
            }
        });
        
        // Minimizar/maximizar chat
        elements.chatToggleBtn.addEventListener('click', () => {
            this.toggleChat();
        });
    },
    
    // Enviar mensagem do jogador
    sendPlayerMessage() {
        const input = this.elements.chatInput;
        const message = input.value.trim();
        
        if (message) {
            // Adicionar mensagem do jogador
            this.addPlayerMessage(message);
            
            // Limpar input
            input.value = '';
            
            // Verificar se é modo online
            if (Game.gameMode === 'online' && Game.onlineMatch.roomId) {
                // Enviar para o servidor
                Game.sendChatMessage(message);
            } else {
                // Modo offline - Simular resposta do oponente após um tempo
                this.scheduleOpponentResponse();
            }
            
            // Tocar som de mensagem se disponível
            if (typeof Audio !== 'undefined' && Audio.play) {
                Audio.play('notification');
            }
            
            // Registrar mensagem para conquistas
            if (typeof Achievements !== 'undefined') {
                Achievements.registerChatMessage();
            }
        }
    },
    
    // Programar resposta do oponente
    scheduleOpponentResponse() {
        // Tempo aleatório entre 2 e 5 segundos
        const delay = 2000 + Math.random() * 3000;
        
        setTimeout(() => {
            // Selecionar uma resposta aleatória
            const randomIndex = Math.floor(Math.random() * this.aiResponses.length);
            const response = this.aiResponses[randomIndex];
            
            // Adicionar a mensagem do oponente
            this.addOpponentMessage(response);
            
            // Tocar som de notificação se disponível
            if (typeof Audio !== 'undefined' && Audio.play) {
                Audio.play('notification');
            }
        }, delay);
    },
    
    // Adicionar mensagem do jogador
    addPlayerMessage(message) {
        const messageElem = document.createElement('div');
        messageElem.className = 'chat-message player-message';
        messageElem.textContent = message;
        
        this.elements.chatMessages.appendChild(messageElem);
        this.scrollToBottom();
        
        // Salvar no histórico
        this.messageHistory.push({
            sender: 'player',
            text: message,
            time: new Date().toISOString()
        });
    },
    
    // Adicionar mensagem do oponente
    addOpponentMessage(message) {
        const messageElem = document.createElement('div');
        messageElem.className = 'chat-message opponent-message';
        messageElem.textContent = message;
        
        this.elements.chatMessages.appendChild(messageElem);
        this.scrollToBottom();
        
        // Salvar no histórico
        this.messageHistory.push({
            sender: 'opponent',
            text: message,
            time: new Date().toISOString()
        });
    },
    
    // Adicionar mensagem do sistema
    addSystemMessage(message) {
        const messageElem = document.createElement('div');
        messageElem.className = 'chat-message system-message';
        messageElem.textContent = message;
        
        this.elements.chatMessages.appendChild(messageElem);
        this.scrollToBottom();
        
        // Salvar no histórico
        this.messageHistory.push({
            sender: 'system',
            text: message,
            time: new Date().toISOString()
        });
    },
    
    // Rolar para o fim da conversa
    scrollToBottom() {
        const messages = this.elements.chatMessages;
        if (messages) {
            messages.scrollTop = messages.scrollHeight;
        }
    },
    
    // Minimizar/maximizar o chat
    toggleChat() {
        const chatContainer = this.elements.chatContainer;
        const toggleBtn = this.elements.chatToggleBtn;
        
        if (!chatContainer || !toggleBtn) return;
        
        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            chatContainer.classList.add('minimized');
            toggleBtn.textContent = '+';
            toggleBtn.title = 'Maximizar chat';
        } else {
            chatContainer.classList.remove('minimized');
            toggleBtn.textContent = '−';
            toggleBtn.title = 'Minimizar chat';
            this.scrollToBottom();
        }
    },
    
    // Limpar chat ao iniciar novo jogo
    reset() {
        if (this.elements.chatMessages) {
            this.elements.chatMessages.innerHTML = '';
            this.messageHistory = [];
            
            // Adicionar mensagem de início de jogo
            this.addSystemMessage("Nova partida iniciada. Boa sorte!");
            
            // Mensagem inicial do oponente
            setTimeout(() => {
                if (Game.gameMode === 'online') {
                    // No modo online, não mostrar mensagem automática inicial
                } else {
                    // No modo offline, mostrar mensagem automática
                    this.addOpponentMessage("Vamos lá! Dessa vez eu vou ganhar!");
                }
            }, 1000);
        }
    },
    
    // Enviar mensagem automática do oponente quando ele jogar
    sendOpponentGameMessage(guessResult) {
        let message;
        
        if (guessResult === 0) {
            message = "Não acertei nenhum número dessa vez!";
        } else if (guessResult === 1) {
            message = "Hmm, acertei apenas um número.";
        } else if (guessResult === 2) {
            message = "Ótimo! Acertei dois números!";
        } else if (guessResult === 3) {
            message = "Acertei todos! Vitória para mim!";
        } else {
            message = "Vamos ver como me saio nessa rodada.";
        }
        
        this.addOpponentMessage(message);
    }
  };