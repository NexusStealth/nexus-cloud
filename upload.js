// Função para determinar o tipo de arquivo
function getFileType(file) {
  const type = file.type.split('/')[0];
  const validTypes = ['image', 'video', 'audio'];
  
  if (validTypes.includes(type)) {
    return type + 's'; // images, videos, audios
  }
  
  // Verificar extensões específicas para documentos
  const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
  const extension = file.name.split('.').pop().toLowerCase();
  
  if (docExtensions.includes(extension)) {
    return 'documents';
  }
  
  return 'others';
}

// Função para atualizar estatísticas de armazenamento
function updateStorageStats(userId, fileSize, fileType) {
  const increment = firebase.firestore.FieldValue.increment(fileSize);
  const countIncrement = firebase.firestore.FieldValue.increment(1);
  
  return db.collection('users').doc(userId).update({
    storageUsed: increment,
    [`fileCount.${fileType}`]: countIncrement
  });
}

// Função principal de upload
async function uploadFile(file) {
  const user = auth.currentUser;
  if (!user) {
    showMessage('Usuário não autenticado', 'error');
    return;
  }
  
  try {
    // Determinar tipo de arquivo
    const fileType = getFileType(file);
    
    // Criar referência no Storage
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`users/${user.uid}/${Date.now()}_${file.name}`);
    
    // Fazer upload
    const uploadTask = fileRef.put(file);
    
    // Monitorar progresso
    uploadTask.on('state_changed',
      (snapshot) => {
        // Progresso do upload
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload progress: ' + progress + '%');
      },
      (error) => {
        // Erro no upload
        console.error('Upload error:', error);
        showMessage('Erro no upload: ' + error.message, 'error');
      },
      () => {
        // Upload completo
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          console.log('File available at', downloadURL);
          
          // Atualizar estatísticas
          updateStorageStats(user.uid, file.size, fileType)
            .then(() => {
              showMessage('Arquivo enviado com sucesso!', 'success');
              // Atualizar dashboard se estiver na página certa
              if (typeof updateDashboard === 'function') {
                updateDashboard();
              }
            })
            .catch((error) => {
              console.error('Erro ao atualizar estatísticas:', error);
              showMessage('Arquivo enviado, mas erro nas estatísticas: ' + error.message, 'warning');
            });
        });
      }
    );
    
  } catch (error) {
    console.error('Erro no upload:', error);
    showMessage('Erro no upload: ' + error.message, 'error');
  }
}

// Inicializar sistema de upload
function initUploadSystem() {
  const fileInput = document.getElementById('fileInput');
  const dropArea = document.getElementById('dropArea');
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        Array.from(e.target.files).forEach(uploadFile);
      }
    });
  }
  
  if (dropArea) {
    // Configurar drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
      dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
      dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (files.length > 0) {
        Array.from(files).forEach(uploadFile);
      }
    }
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initUploadSystem);