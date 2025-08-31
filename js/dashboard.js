// dashboard.js - Código atualizado

// Verificar autenticação
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        document.getElementById('userName').textContent = user.displayName || user.email;
        loadUserData(user.uid);
    }
});

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

// Função para fazer upload real para o Firebase Storage
async function uploadFileToStorage(file, userId) {
    const fileType = getFileType(file);
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`users/${userId}/${fileType}/${Date.now()}_${file.name}`);
    
    // Fazer upload do arquivo
    const uploadTask = fileRef.put(file);
    
    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                // Observar progresso
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                document.getElementById('progressBar').style.width = progress + '%';
                document.getElementById('progressText').textContent = Math.round(progress) + '%';
            },
            (error) => {
                // Em caso de erro
                reject(error);
            },
            () => {
                // Upload completo
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    resolve({
                        url: downloadURL,
                        ref: fileRef,
                        type: fileType
                    });
                });
            }
        );
    });
}

// Função para salvar metadados no Firestore
async function saveFileMetadata(userId, fileData, file) {
    const metadata = {
        name: file.name,
        size: file.size,
        type: fileData.type,
        extension: file.name.split('.').pop().toLowerCase(),
        downloadURL: fileData.url,
        storagePath: fileData.ref.fullPath,
        userId: userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('files').add(metadata);
    
    // Atualizar contador de arquivos do usuário
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
        const userData = userDoc.data();
        const fileCount = userData.fileCount || {
            images: 0,
            videos: 0,
            documents: 0,
            audios: 0,
            others: 0
        };
        
        fileCount[fileData.type] = (fileCount[fileData.type] || 0) + 1;
        const storageUsed = (userData.storageUsed || 0) + file.size;
        
        await userRef.update({
            fileCount,
            storageUsed
        });
    }
}

// Função principal de upload
async function startUpload() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadButton').disabled = true;
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileData = await uploadFileToStorage(file, user.uid);
            await saveFileMetadata(user.uid, fileData, file);
        }
        
        alert('Upload completo!');
        closeModal('uploadModal');
        
        // Recarregar os dados do usuário para atualizar as estatísticas
        loadUserData(user.uid);
    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao fazer upload: ' + error.message);
    } finally {
        resetUploadProgress();
    }
}

// Carregar dados do usuário
function loadUserData(userId) {
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                updateDashboard(userData);
                
                // Carregar arquivos recentes
                loadRecentFiles(userId);
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar dados do usuário:', error);
        });
}

// Carregar arquivos recentes
function loadRecentFiles(userId) {
    db.collection('files')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
        .then((querySnapshot) => {
            const filesList = document.getElementById('recentFiles');
            
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
        })
        .catch((error) => {
            console.error('Erro ao carregar arquivos recentes:', error);
        });
}

// Criar elemento de item de arquivo
function createFileItem(file, fileId) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const iconClass = getFileIconClass(file.type, file.extension);
    
    fileItem.innerHTML = `
        <div class="file-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-details">
                ${formatBytes(file.size)} • ${file.extension.toUpperCase()}
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
        
        // Recarregar dados
        loadUserData(user.uid);
        alert('Arquivo excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir arquivo:', error);
        alert('Erro ao excluir arquivo: ' + error.message);
    }
}

// Mostrar arquivos por tipo (redirecionar para página específica)
function showFiles(type) {
    window.location.href = `files.html?type=${type}`;
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

// Restante do código permanece igual...