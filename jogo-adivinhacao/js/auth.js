// Funções relacionadas à autenticação
const Auth = {
    // Elementos da interface
    elements: {
        // Login e Registro
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        loginUsername: document.getElementById('login-username'),
        loginPassword: document.getElementById('login-password'),
        loginBtn: document.getElementById('login-btn'),
        showRegisterBtn: document.getElementById('show-register-btn'),
        loginMessage: document.getElementById('login-message'),
        
        registerFirstname: document.getElementById('register-firstname'),
        registerLastname: document.getElementById('register-lastname'),
        registerUsername: document.getElementById('register-username'),
        registerPassword: document.getElementById('register-password'),
        profilePicUpload: document.getElementById('profile-pic-upload'),
        profilePicUrl: document.getElementById('profile-pic-url'),
        profilePreview: document.getElementById('profile-preview'),
        profilePreviewInitial: document.getElementById('profile-preview-initial'),
        registerBtn: document.getElementById('register-btn'),
        backToLoginBtn: document.getElementById('back-to-login-btn'),
        registerMessage: document.getElementById('register-message'),
        
        // Cabeçalho
        userHeader: document.getElementById('user-header'),
        headerUsername: document.getElementById('header-username'),
        headerProfilePic: document.getElementById('header-profile-pic'),
        headerProfileInitial: document.getElementById('header-profile-initial'),
        logoutBtn: document.getElementById('logout-btn')
    },
    
    // Inicializar autenticação
    init() {
        // Verificar sessão existente
        const savedSessionId = localStorage.getItem('gameSessionId');
        if (savedSessionId) {
            const user = DB.checkSession(savedSessionId);
            if (user) {
                // Sessão válida, login automático
                gameState.currentUser = user;
                gameState.sessionId = savedSessionId;
                this.updateUserInterface(user);
                UI.showScreen('menu');
            }
        }
        
        // Event listeners
        this.setupEventListeners();
    },
    
    // Configurar os event listeners
    setupEventListeners() {
        const elements = this.elements;
        
        // Mostrar formulário de registro
        elements.showRegisterBtn.addEventListener('click', () => {
            elements.loginForm.style.display = 'none';
            elements.registerForm.style.display = 'block';
        });
        
        // Voltar para o login
        elements.backToLoginBtn.addEventListener('click', () => {
            elements.registerForm.style.display = 'none';
            elements.loginForm.style.display = 'block';
        });
        
        // Upload de imagem
        elements.profilePicUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.updateImagePreview(file);
            }
        });
        
        // Preview da foto de perfil ao digitar URL
        elements.profilePicUrl.addEventListener('input', () => {
            const url = elements.profilePicUrl.value.trim();
            const firstName = elements.registerFirstname.value.trim();
            
            if (url) {
                // Tentar carregar a imagem
                const img = document.createElement('img');
                img.src = url;
                img.alt = firstName || 'Preview';
                
                // Limpar o conteúdo atual
                elements.profilePreview.innerHTML = '';
                elements.profilePreviewInitial.style.display = 'none';
                
                // Adicionar a imagem
                elements.profilePreview.appendChild(img);
            } else if (firstName) {
                // Usar inicial do nome
                const initial = firstName.charAt(0).toUpperCase();
                elements.profilePreviewInitial.textContent = initial;
                elements.profilePreviewInitial.style.display = 'flex';
            } else {
                // Placeholder padrão
                elements.profilePreviewInitial.textContent = '?';
                elements.profilePreviewInitial.style.display = 'flex';
            }
        });
        
        // Atualizar inicial ao digitar nome
        elements.registerFirstname.addEventListener('input', () => {
            const url = elements.profilePicUrl.value.trim();
            const firstName = elements.registerFirstname.value.trim();
            
            if (!url && firstName) {
                // Usar inicial do nome
                const initial = firstName.charAt(0).toUpperCase();
                elements.profilePreviewInitial.textContent = initial;
                elements.profilePreviewInitial.style.display = 'flex';
            } else if (!url) {
                // Placeholder padrão
                elements.profilePreviewInitial.textContent = '?';
                elements.profilePreviewInitial.style.display = 'flex';
            }
        });
        
        // Login
        elements.loginBtn.addEventListener('click', () => {
            const username = elements.loginUsername.value.trim();
            const password = elements.loginPassword.value;
            
            if (!username || !password) {
                elements.loginMessage.textContent = "Por favor, preencha todos os campos.";
                elements.loginMessage.className = "message error";
                
                // Tocar som de erro
                if (typeof Audio !== 'undefined') {
                    Audio.play('wrongGuess');
                }
                return;
            }
            
            // Tentar login
            const result = DB.login(username, password);
            
            if (result.success) {
                // Login bem-sucedido
                
                // Tocar APENAS o som de login, não tocar o som de botão neste caso
                if (typeof Audio !== 'undefined') {
                    // Parar qualquer som de botão que possa estar tocando
                    Audio.stop('buttonClick');
                    // Tocar o som de login
                    Audio.play('login');
                }
                
                gameState.currentUser = result.user;
                gameState.sessionId = result.sessionId;
                
                // Salvar sessão
                localStorage.setItem('gameSessionId', result.sessionId);
                
                // Atualizar interface
                this.updateUserInterface(result.user);
                
                // Mostrar menu principal
                UI.showScreen('menu');
            } else {
                // Falha no login
                
                // Tocar som de erro
                if (typeof Audio !== 'undefined') {
                    Audio.play('wrongGuess');
                }
                
                elements.loginMessage.textContent = result.message;
                elements.loginMessage.className = "message error";
            }
        });
        
        // Registro
        elements.registerBtn.addEventListener('click', () => {
            const firstName = elements.registerFirstname.value.trim();
            const lastName = elements.registerLastname.value.trim();
            const username = elements.registerUsername.value.trim();
            const password = elements.registerPassword.value;
            const profilePicUrl = elements.profilePicUrl.value.trim();
            const profilePicFile = elements.profilePicUpload.files[0];
            
            if (!firstName || !lastName || !username || !password) {
                elements.registerMessage.textContent = "Por favor, preencha todos os campos obrigatórios.";
                elements.registerMessage.className = "message error";
                
                // Tocar som de erro
                if (typeof Audio !== 'undefined') {
                    Audio.play('wrongGuess');
                }
                return;
            }
            
            // Função para continuar o registro com a URL da imagem
            const continueRegistration = (imageUrl) => {
                // Criar usuário
                const result = DB.createUser({
                    firstName,
                    lastName,
                    username,
                    password,
                    profilePic: imageUrl
                });
                
                if (result.success) {
                    // Registro bem-sucedido
                    
                    // Tocar som de registro bem-sucedido
                    if (typeof Audio !== 'undefined') {
                        // Parar qualquer som de botão que possa estar tocando
                        Audio.stop('buttonClick');
                        // Tocar o som de registro
                        Audio.play('register');
                    }
                    
                    elements.registerMessage.textContent = "Conta criada com sucesso! Você pode fazer login agora.";
                    elements.registerMessage.className = "message success";
                    
                    // Limpar campos
                    elements.registerFirstname.value = '';
                    elements.registerLastname.value = '';
                    elements.registerUsername.value = '';
                    elements.registerPassword.value = '';
                    elements.profilePicUrl.value = '';
                    elements.profilePicUpload.value = '';
                    
                    // Voltar para o login após um breve delay
                    setTimeout(() => {
                        elements.registerForm.style.display = 'none';
                        elements.loginForm.style.display = 'block';
                        elements.loginMessage.textContent = "Conta criada! Faça login com suas credenciais.";
                        elements.loginMessage.className = "message success";
                    }, 1500);
                } else {
                    // Falha no registro
                    
                    // Tocar som de erro
                    if (typeof Audio !== 'undefined') {
                        Audio.play('wrongGuess');
                    }
                    
                    elements.registerMessage.textContent = result.message;
                    elements.registerMessage.className = "message error";
                }
            };
            
            // Verificar se há um arquivo de imagem selecionado
            if (profilePicFile) {
                this.processImageUpload(profilePicFile)
                    .then(dataUrl => {
                        continueRegistration(dataUrl);
                    })
                    .catch(error => {
                        // Tocar som de erro
                        if (typeof Audio !== 'undefined') {
                            Audio.play('wrongGuess');
                        }
                        
                        elements.registerMessage.textContent = error.message;
                        elements.registerMessage.className = "message error";
                    });
            } else {
                // Usar a URL se não houver arquivo
                continueRegistration(profilePicUrl);
            }
        });
        
        // Logout
        elements.logoutBtn.addEventListener('click', this.logout.bind(this));
    },
    
    // Processar upload de imagem
  processImageUpload(file) {
      return new Promise((resolve, reject) => {
          if (!file || !file.type.match('image.*')) {
              reject(new Error('Por favor, selecione uma imagem válida.'));
              return;
          }
          
          // Tamanho máximo: 1MB
          if (file.size > 1024 * 1024) {
              reject(new Error('A imagem deve ter menos de 1MB.'));
              return;
          }
          
          const reader = new FileReader();
          
          reader.onload = (e) => {
              resolve(e.target.result); // Retorna a URL base64
          };
          
          reader.onerror = () => {
              reject(new Error('Erro ao ler o arquivo.'));
          };
          
          reader.readAsDataURL(file);
      });
  },
  
  // Atualizar preview da imagem com base no arquivo
  updateImagePreview(file) {
      this.processImageUpload(file)
          .then(dataUrl => {
              const elements = this.elements;
              
              // Criar elemento de imagem
              const img = document.createElement('img');
              img.src = dataUrl;
              img.alt = 'Preview';
              
              // Limpar o conteúdo atual
              elements.profilePreview.innerHTML = '';
              elements.profilePreviewInitial.style.display = 'none';
              
              // Adicionar a imagem
              elements.profilePreview.appendChild(img);
          })
          .catch(error => {
              // Tocar som de erro
              if (typeof Audio !== 'undefined') {
                  Audio.play('wrongGuess');
              }
              
              alert(error.message);
          });
  },
  
  // Atualizar interface do usuário após login
  updateUserInterface(user) {
      if (!user) return;
      
      const elements = this.elements;
      
      // Atualizar cabeçalho
      elements.headerUsername.textContent = user.username;
      
      // Configurar a foto de perfil ou inicial
      if (user.profilePic) {
          // Criar elemento de imagem
          const img = document.createElement('img');
          img.src = user.profilePic;
          img.alt = user.firstName;
          
          // Limpar o conteúdo atual
          elements.headerProfilePic.innerHTML = '';
          elements.headerProfileInitial.style.display = 'none';
          
          // Adicionar a imagem
          elements.headerProfilePic.appendChild(img);
      } else {
          // Usar inicial do nome
          const initial = user.firstName.charAt(0).toUpperCase();
          elements.headerProfileInitial.textContent = initial;
          elements.headerProfileInitial.style.display = 'block';
      }
      
      // Mostrar o cabeçalho
      elements.userHeader.style.display = 'flex';
  },
  
  // Função de logout
  logout() {
      // Tocar som de notificação
      if (typeof Audio !== 'undefined') {
          Audio.play('notification');
          
          // Parar qualquer música de fundo
          if (Audio.stopBackgroundMusic) {
              Audio.stopBackgroundMusic();
          }
      }
      
      // Encerrar sessão
      if (gameState.sessionId) {
          DB.logout(gameState.sessionId);
          localStorage.removeItem('gameSessionId');
      }
      
      // Limpar estado
      gameState.currentUser = null;
      gameState.sessionId = null;
      
      // Esconder cabeçalho
      this.elements.userHeader.style.display = 'none';
      
      // Voltar para a tela de login
      UI.showScreen('login');
      
      // Limpar campos de login
      this.elements.loginUsername.value = '';
      this.elements.loginPassword.value = '';
      this.elements.loginMessage.textContent = '';
      this.elements.loginMessage.className = 'message';
  }
  };