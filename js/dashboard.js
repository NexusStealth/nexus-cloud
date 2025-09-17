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

function startUpload() {
    if (!selectedFile || !currentUser) return;
    
    document.getElementById('uploadProgress').style.display = 'block';
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`users/${currentUser.uid}/files/${Date.now()}_${selectedFile.name}`);
    const uploadTask = fileRef.put(selectedFile);
    
    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('progressText').textContent = Math.round(progress) + '%';
        },
        (error) => {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload: ' + error.message);
            closeModal();
        },
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                saveFileMetadata(selectedFile, downloadURL);
            }).catch(error => {
                console.error('Erro ao obter URL:', error);
                alert('Erro ao finalizar upload: ' + error.message);
                closeModal();
            });
        }
    );
}

// Função para formatar bytes em tamanho legível
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Atualiza o dashboard com contadores e espaço usado
function loadUserData(uid) {
    firebase.firestore().collection('files').where('owner', '==', uid).get()
        .then(snapshot => {
            let storageUsed = 0;
            let fileCount = { images: 0, videos: 0, documents: 0, audios: 0, others: 0 };
            snapshot.forEach(doc => {
                const data = doc.data();
                storageUsed += data.size || 0;
                if (fileCount[data.category] !== undefined) fileCount[data.category]++;
                else fileCount.others++;
            });
            if(document.getElementById('storageUsed'))
                document.getElementById('storageUsed').textContent = formatBytes(storageUsed);
            if(document.getElementById('totalFiles'))
                document.getElementById('totalFiles').textContent = snapshot.size;
            if(document.getElementById('imageCount'))
                document.getElementById('imageCount').textContent = `${fileCount.images} arquivos`;
            if(document.getElementById('videoCount'))
                document.getElementById('videoCount').textContent = `${fileCount.videos} arquivos`;
            if(document.getElementById('documentCount'))
                document.getElementById('documentCount').textContent = `${fileCount.documents} arquivos`;
            if(document.getElementById('audioCount'))
                document.getElementById('audioCount').textContent = `${fileCount.audios} arquivos`;
            if(document.getElementById('otherCount'))
                document.getElementById('otherCount').textContent = `${fileCount.others} arquivos`;
        })
        .catch(err => {
            console.error('Erro ao carregar dados do usuário:', err);
        });
}

// Lista arquivos recentes (últimos 5)
function listRecentFiles(uid) {
    firebase.firestore().collection('files')
        .where('owner', '==', uid)
        .orderBy('uploadDate', 'desc')
        .limit(5)
        .get()
        .then(snapshot => {
            const filesList = document.getElementById('recentFiles');
            if (!filesList) return;
            filesList.innerHTML = '';
            if (snapshot.empty) {
                filesList.innerHTML = `<div class=\"empty-state\"><i class='fas fa-cloud-upload-alt'></i><p>Nenhum arquivo encontrado</p></div>`;
                return;
            }
            snapshot.forEach(doc => {
                const data = doc.data();
                filesList.innerHTML += renderFileItem(doc.id, data, true);
            });
        })
        .catch(err => {
            console.error('Erro ao listar arquivos recentes:', err);
        });
}

// Lista arquivos por categoria
function listFilesByCategory(uid, category) {
    firebase.firestore().collection('files')
        .where('owner', '==', uid)
        .where('category', '==', category)
        .orderBy('uploadDate', 'desc')
        .get()
        .then(snapshot => {
            let filesList = document.getElementById('recentFiles');
            if (!filesList) {
                filesList = document.createElement('div');
                filesList.id = 'recentFiles';
                document.body.appendChild(filesList);
            }
            filesList.innerHTML = '';
            if (snapshot.empty) {
                filesList.innerHTML = `<div class=\"empty-state\"><i class='fas fa-cloud-upload-alt'></i><p>Nenhum arquivo encontrado</p></div>`;
                return;
            }
            snapshot.forEach(doc => {
                const data = doc.data();
                filesList.innerHTML += renderFileItem(doc.id, data, true);
            });
        })
        .catch(err => {
            console.error('Erro ao listar arquivos por categoria:', err);
        });
}

// Renderiza um item de arquivo
function renderFileItem(id, data, showActions = false) {
    const shortName = data.name.length > 20 ? data.name.substring(0, 17) + '...' : data.name;
    let date = data.uploadDate;
    if (date && typeof date.toDate === 'function') date = date.toDate();
    else date = new Date(date);
    const dateStr = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    return `
    <div class=\"file-item\">
        <div class=\"file-info\">
            <span title=\"${data.name}\"><b>${shortName}</b></span>
            <span>${formatBytes(data.size)}</span>
            <span>${data.type || '-'}</span>
            <span>${dateStr}</span>
        </div>
        <div class=\"file-actions\">
            <a href=\"${data.downloadURL}\" download target=\"_blank\" class=\"btn btn-outline\"><i class=\"fas fa-download\"></i></a>
            ${showActions ? `<button class=\"btn btn-outline\" onclick=\"deleteFile('${id}', '${data.name}')\"><i class=\"fas fa-trash\"></i></button>` : ''}
        </div>
    </div>`;
}

// Exclui arquivo do Firestore e Storage
function deleteFile(id, fileName) {
    if (!confirm(`Deseja realmente apagar o arquivo: ${fileName}?`)) return;
    firebase.firestore().collection('files').doc(id).get().then(doc => {
        if (!doc.exists) return alert('Arquivo não encontrado!');
        const data = doc.data();
        // Remove do Storage
        const storageRef = firebase.storage().refFromURL(data.downloadURL);
        storageRef.delete().then(() => {
            // Remove do Firestore
            firebase.firestore().collection('files').doc(id).delete().then(() => {
                alert('Arquivo apagado com sucesso!');
                if (typeof loadUserData === 'function') loadUserData(data.owner);
                if (typeof listRecentFiles === 'function') listRecentFiles(data.owner);
            });
        }).catch(err => {
            alert('Erro ao apagar do Storage: ' + err.message);
        });
    });
}

// Exporta funções para uso global
window.loadUserData = loadUserData;
window.listFilesByCategory = listFilesByCategory;
window.listRecentFiles = listRecentFiles;
window.deleteFile = deleteFile;

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

// Restante do código permanece igual...