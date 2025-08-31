// files.js
// Verificar autenticação
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        // Obter o tipo de arquivo da URL
        const urlParams = new URLSearchParams(window.location.search);
        const fileType = urlParams.get('type');
        
        // Definir título da página
        const typeNames = {
            'images': 'Imagens',
            'videos': 'Vídeos',
            'documents': 'Documentos',
            'audios': 'Áudios',
            'others': 'Outros Arquivos'
        };
        
        document.getElementById('page-title').textContent = typeNames[fileType] || 'Todos os Arquivos';
        
        // Carregar arquivos
        loadFiles(user.uid, fileType);
    }
});

// Carregar arquivos do usuário
async function loadFiles(userId, fileType) {
    try {
        let query = db.collection('files').where('userId', '==', userId);
        
        // Se um tipo específico foi solicitado, filtrar por tipo
        if (fileType && fileType !== 'all') {
            query = query.where('type', '==', fileType);
        }
        
        // Ordenar por data de criação (mais recentes primeiro)
        query = query.orderBy('createdAt', 'desc');
        
        const querySnapshot = await query.get();
        const filesList = document.getElementById('files-list');
        
        if (querySnapshot.empty) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Nenhum arquivo encontrado</p>
                    <button class="btn btn-primary" onclick="uploadFile()">Fazer Upload</button>
                </div>
            `;
            return;
        }
        
        filesList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const file = doc.data();
            const fileItem = createFileItem(file, doc.id);
            filesList.appendChild(fileItem);
        });
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
        document.getElementById('files-list').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar arquivos</p>
            </div>
        `;
    }
}

// Criar elemento de item de arquivo
function createFileItem(file, fileId) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const iconClass = getFileIconClass(file.type, file.extension);
    const uploadDate = file.createdAt ? file.createdAt.toDate().toLocaleDateString('pt-BR') : 'Data desconhecida';
    
    fileItem.innerHTML = `
        <div class="file-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-details">
                ${formatBytes(file.size)} • ${file.extension.toUpperCase()} • ${uploadDate}
            </div>
        </div>
        <div class="file-actions">
            <button class="btn-icon" onclick="downloadFile('${file.downloadURL}', '${file.name}')">
                <i class="fas fa-download"></i>
            </button>
            <button class="btn-icon btn-danger" onclick="deleteFile('${fileId}', '${file.name}', '${file.type}', ${file.size})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return fileItem;
}

// Obter classe do ícone baseado no tipo de arquivo
function getFileIconClass(fileType, extension) {
    const iconMap = {
        images: 'fas fa-image',
        videos: 'fas fa-video',
        audios: 'fas fa-music',
        documents: 'fas fa-file-alt',
        others: 'fas fa-file'
    };
    
    // Ícones específicos para extensões de documentos
    const docIcons = {
        pdf: 'fas fa-file-pdf',
        doc: 'fas fa-file-word',
        docx: 'fas fa-file-word',
        xls: 'fas fa-file-excel',
        xlsx: 'fas fa-file-excel',
        ppt: 'fas fa-file-powerpoint',
        pptx: 'fas fa-file-powerpoint',
        txt: 'fas fa-file-alt'
    };
    
    if (fileType === 'documents' && docIcons[extension]) {
        return docIcons[extension];
    }
    
    return iconMap[fileType] || 'fas fa-file';
}

// Download de arquivo
function downloadFile(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Excluir arquivo
async function deleteFile(fileId, fileName, fileType, fileSize) {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${fileName}"?`)) {
        return;
    }
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Primeiro, excluir do Firestore
        await db.collection('files').doc(fileId).delete();
        
        // Depois, excluir do Storage
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`users/${user.uid}/${fileType}/${fileName}`);
        await fileRef.delete();
        
        // Atualizar estatísticas do usuário
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const fileCount = userData.fileCount || {};
            const storageUsed = (userData.storageUsed || 0) - fileSize;
            
            if (fileCount[fileType] > 0) {
                fileCount[fileType]--;
            }
            
            await userRef.update({
                fileCount,
                storageUsed: storageUsed > 0 ? storageUsed : 0
            });
        }
        
        // Recarregar arquivos
        const urlParams = new URLSearchParams(window.location.search);
        const fileTypeParam = urlParams.get('type');
        loadFiles(user.uid, fileTypeParam);
        
        alert('Arquivo excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir arquivo:', error);
        alert('Erro ao excluir arquivo: ' + error.message);
    }
}

// Formatador de bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Funções do modal de upload (similares ao dashboard.js)
function uploadFile() {
    document.getElementById('uploadModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    resetUploadProgress();
}

function resetUploadProgress() {
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    document.getElementById('uploadButton').disabled = true;
}

// Logout
function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Erro ao fazer logout:', error);
        });
}

// Configurar drag and drop (similar ao dashboard.js)
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    
    if (dropArea && fileInput) {
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
            dropArea.style.borderColor = 'var(--primary)';
            dropArea.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        }
        
        function unhighlight() {
            dropArea.style.borderColor = 'var(--gray-dark)';
            dropArea.style.backgroundColor = 'transparent';
        }
        
        dropArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            document.getElementById('uploadButton').disabled = false;
        }
        
        fileInput.addEventListener('change', function() {
            document.getElementById('uploadButton').disabled = this.files.length === 0;
        });
    }
});