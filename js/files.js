// files.js - Gestão de arquivos

let currentUser = null;
let currentView = 'grid';
let allFiles = [];
let currentType = 'all';

// Verificar autenticação
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        // Obter parâmetro da URL para filtrar por tipo
        const urlParams = new URLSearchParams(window.location.search);
        currentType = urlParams.get('type') || 'all';
        
        // Atualizar título da página
        updatePageTitle();
        
        // Carregar arquivos
        loadFiles();
    } else {
        window.location.href = 'index.html';
    }
});

function updatePageTitle() {
    const titles = {
        'all': 'Todos os Arquivos',
        'images': 'Imagens',
        'videos': 'Vídeos',
        'documents': 'Documentos',
        'audios': 'Áudios',
        'others': 'Outros Arquivos'
    };
    
    document.getElementById('pageTitle').textContent = titles[currentType] || 'Arquivos';
}

function loadFiles() {
    let query = firebase.firestore().collection('files')
        .where('owner', '==', currentUser.uid)
        .orderBy('uploadDate', 'desc');
    
    // Se não for "all", filtrar por categoria
    if (currentType !== 'all') {
        query = query.where('category', '==', currentType);
    }
    
    query.get().then(snapshot => {
        allFiles = [];
        snapshot.forEach(doc => {
            allFiles.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayFiles(allFiles);
    }).catch(error => {
        console.error('Erro ao carregar arquivos:', error);
    });
}

function displayFiles(files) {
    const filesGrid = document.getElementById('filesGrid');
    const filesTableBody = document.getElementById('filesTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (files.length === 0) {
        filesGrid.innerHTML = '';
        filesTableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Exibir em grade
    filesGrid.innerHTML = files.map(file => renderFileCard(file)).join('');
    
    // Exibir em tabela
    filesTableBody.innerHTML = files.map(file => renderFileRow(file)).join('');
}

function renderFileCard(file) {
    const uploadDate = file.uploadDate ? file.uploadDate.toDate().toLocaleDateString('pt-BR') : 'Data desconhecida';
    const shortName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
    const fileIcon = getFileIcon(file.type, file.name);
    
    return `
    <div class="file-card">
        <div class="file-preview">
            ${file.category === 'images' ? 
                `<img src="${file.downloadURL}" alt="${file.name}">` : 
                `<div class="icon">${fileIcon}</div>`
            }
        </div>
        <div class="file-info">
            <div class="file-name" title="${file.name}">${shortName}</div>
            <div class="file-details">
                <span>${formatBytes(file.size)}</span>
                <span>${uploadDate}</span>
            </div>
            <div class="file-actions">
                <button class="btn-icon" onclick="downloadFile('${file.downloadURL}', '${file.name}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteFile('${file.id}', '${file.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>`;
}

function renderFileRow(file) {
    const uploadDate = file.uploadDate ? file.uploadDate.toDate().toLocaleDateString('pt-BR') : 'Data desconhecida';
    const shortName = file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name;
    const fileIcon = getFileIcon(file.type, file.name);
    const fileType = getFileTypeName(file.type, file.name);
    
    return `
    <tr>
        <td class="file-icon-cell">${fileIcon}</td>
        <td class="file-name-cell"><span title="${file.name}">${shortName}</span></td>
        <td>${formatBytes(file.size)}</td>
        <td>${fileType}</td>
        <td>${uploadDate}</td>
        <td>
            <div class="file-actions">
                <button class="btn-icon" onclick="downloadFile('${file.downloadURL}', '${file.name}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteFile('${file.id}', '${file.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    </tr>`;
}

function getFileIcon(mimeType, fileName) {
    if (mimeType.startsWith('image/')) return '<i class="fas fa-image"></i>';
    if (mimeType.startsWith('video/')) return '<i class="fas fa-video"></i>';
    if (mimeType.startsWith('audio/')) return '<i class="fas fa-music"></i>';
    
    const extension = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return '<i class="fas fa-file-pdf"></i>';
    if (['doc', 'docx'].includes(extension)) return '<i class="fas fa-file-word"></i>';
    if (['xls', 'xlsx'].includes(extension)) return '<i class="fas fa-file-excel"></i>';
    if (['ppt', 'pptx'].includes(extension)) return '<i class="fas fa-file-powerpoint"></i>';
    if (['zip', 'rar', '7z'].includes(extension)) return '<i class="fas fa-file-archive"></i>';
    if (['txt'].includes(extension)) return '<i class="fas fa-file-alt"></i>';
    
    return '<i class="fas fa-file"></i>';
}

function getFileTypeName(mimeType, fileName) {
    if (mimeType.startsWith('image/')) return 'Imagem';
    if (mimeType.startsWith('video/')) return 'Vídeo';
    if (mimeType.startsWith('audio/')) return 'Áudio';
    
    const extension = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return 'PDF';
    if (['doc', 'docx'].includes(extension)) return 'Documento Word';
    if (['xls', 'xlsx'].includes(extension)) return 'Planilha Excel';
    if (['ppt', 'pptx'].includes(extension)) return 'Apresentação PowerPoint';
    if (['zip', 'rar', '7z'].includes(extension)) return 'Arquivo Compactado';
    if (['txt'].includes(extension)) return 'Texto';
    
    return mimeType || 'Arquivo';
}

function toggleView(view) {
    currentView = view;
    const gridViewBtn = document.getElementById('gridViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const filesGrid = document.getElementById('filesGrid');
    const filesTable = document.getElementById('filesTable');
    
    if (view === 'grid') {
        gridViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        filesGrid.style.display = 'grid';
        filesTable.style.display = 'none';
    } else {
        gridViewBtn.classList.remove('active');
        tableViewBtn.classList.add('active');
        filesGrid.style.display = 'none';
        filesTable.style.display = 'table';
    }
}

function downloadFile(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function deleteFile(fileId, fileName) {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${fileName}"?`)) {
        return;
    }
    
    // Primeiro, excluir do Firestore
    firebase.firestore().collection('files').doc(fileId).delete()
        .then(() => {
            // Recarregar a lista de arquivos
            loadFiles();
            
            // Atualizar o dashboard se estiver na mesma sessão
            if (typeof loadUserData === 'function') {
                loadUserData(currentUser.uid);
            }
        })
        .catch(error => {
            console.error('Erro ao excluir arquivo:', error);
            alert('Erro ao excluir arquivo: ' + error.message);
        });
}

function goToUpload() {
    window.location.href = 'dashboard.html';
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// Função para formatar bytes (já existente no dashboard.js)
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}