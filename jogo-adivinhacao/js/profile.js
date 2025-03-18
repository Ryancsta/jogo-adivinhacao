// Funções relacionadas ao perfil do usuário
const Profile = {
  // Elementos da interface
  elements: {
      profileDisplay: document.getElementById('profile-display'),
      profileDisplayInitial: document.getElementById('profile-display-initial'),
      editFirstname: document.getElementById('edit-firstname'),
      editLastname: document.getElementById('edit-lastname'),
      editUsername: document.getElementById('edit-username'),
      editPicUpload: document.getElementById('edit-pic-upload'),
      editPicUrl: document.getElementById('edit-pic-url'),
      updateProfileBtn: document.getElementById('update-profile-btn'),
      backToMenuFromProfileBtn: document.getElementById('back-to-menu-from-profile-btn'),
      profileMessage: document.getElementById('profile-message'),
      userWins: document.getElementById('user-wins'),
      gamesPlayed: document.getElementById('games-played'),
      profileBtn: document.getElementById('profile-btn')
  },
  
  // Inicializar perfil
  init() {
      // Event listeners
      this.setupEventListeners();
  },
  
  // Configurar os event listeners
  setupEventListeners() {
      const elements = this.elements;
      
      // Botão de perfil no menu
      elements.profileBtn.addEventListener('click', () => {
          this.updateProfileScreen(gameState.currentUser);
          UI.showScreen('profile');
      });
      
      // Botão de voltar ao menu
      elements.backToMenuFromProfileBtn.addEventListener('click', () => {
          UI.showScreen('menu');
      });
      
      // Upload de imagem no perfil
      elements.editPicUpload.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
              this.processImageUpload(file)
                  .then(dataUrl => {
                      // Atualizar preview
                      const img = document.createElement('img');
                      img.src = dataUrl;
                      img.alt = 'Preview';
                      
                      // Limpar o conteúdo atual
                      elements.profileDisplay.innerHTML = '';
                      elements.profileDisplayInitial.style.display = 'none';
                      
                      // Adicionar a imagem
                      elements.profileDisplay.appendChild(img);
                      
                      // Atualizar campo de URL também
                      elements.editPicUrl.value = dataUrl;
                  })
                  .catch(error => {
                      elements.profileMessage.textContent = error.message;
                      elements.profileMessage.className = "message error";
                  });
          }
      });
      
      // Botão de atualizar foto
      elements.updateProfileBtn.addEventListener('click', () => {
          const newPicUrl = elements.editPicUrl.value.trim();
          
          // Atualizar foto no banco de dados
          const updated = DB.updateProfile(gameState.currentUser.id, {
              profilePic: newPicUrl
          });
          
          if (updated) {
              // Atualizar usuário no estado
              gameState.currentUser.profilePic = newPicUrl;
              
              // Atualizar interface
              this.updateProfileScreen(gameState.currentUser);
              Auth.updateUserInterface(gameState.currentUser);
              
              // Mensagem de sucesso
              elements.profileMessage.textContent = "Foto de perfil atualizada com sucesso!";
              elements.profileMessage.className = "message success";
              
              // Limpar mensagem após 3 segundos
              setTimeout(() => {
                  elements.profileMessage.textContent = "";
                  elements.profileMessage.className = "message";
              }, 3000);
          } else {
              // Mensagem de erro
              elements.profileMessage.textContent = "Erro ao atualizar foto de perfil.";
              elements.profileMessage.className = "message error";
          }
      });
  },
  
  // Processar upload de imagem (perfil)
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
  
  // Atualizar a tela de perfil com os dados do usuário
  updateProfileScreen(user) {
      if (!user) return;
      
      const elements = this.elements;
      
      // Preencher campos
      elements.editFirstname.value = user.firstName;
      elements.editLastname.value = user.lastName;
      elements.editUsername.value = user.username;
      elements.editPicUrl.value = user.profilePic || '';
      
      // Atualizar estatísticas
      elements.userWins.textContent = user.stats.wins;
      elements.gamesPlayed.textContent = user.stats.gamesPlayed;
      
      // Configurar a foto de perfil ou inicial
      if (user.profilePic) {
          // Criar elemento de imagem
          const img = document.createElement('img');
          img.src = user.profilePic;
          img.alt = user.firstName;
          
          // Limpar o conteúdo atual
          elements.profileDisplay.innerHTML = '';
          elements.profileDisplayInitial.style.display = 'none';
          
          // Adicionar a imagem
          elements.profileDisplay.appendChild(img);
      } else {
          // Usar inicial do nome
          const initial = user.firstName.charAt(0).toUpperCase();
          elements.profileDisplayInitial.textContent = initial;
          elements.profileDisplayInitial.style.display = 'flex';
      }
  }
};