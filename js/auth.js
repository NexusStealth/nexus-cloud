// auth.js

// Função para atualizar o último login
function updateLastLogin(userId) {
    return db.collection('users').doc(userId).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Função para verificar/criar usuário no Firestore
function checkUserExists(user) {
    return db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (!doc.exists) {
                // Criar usuário se não existir
                return db.collection('users').doc(user.uid).set({
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    phone: '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    storageUsed: 0,
                    fileCount: {
                        images: 0,
                        videos: 0,
                        documents: 0,
                        audios: 0,
                        others: 0
                    }
                });
            } else {
                // Atualizar último login se usuário já existe
                return updateLastLogin(user.uid);
            }
        })
        .catch((error) => {
            console.error('Erro ao verificar/criar usuário:', error);
            throw error; // Propagar o erro para o próximo catch
        });
}

// Função de login com email e senha
function loginWithEmail(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Login bem-sucedido', userCredential.user);
            // Atualizar último login
            return updateLastLogin(userCredential.user.uid);
        })
        .then(() => {
            showMessage('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        })
        .catch((error) => {
            console.error('Erro no login', error);
            showMessage('Erro ao fazer login: ' + error.message, 'error');
        });
}

// Função de login com Google - CORRIGIDA
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Login com Google bem-sucedido', result.user);
            // Verificar/criar usuário e atualizar último login
            return checkUserExists(result.user);
        })
        .then(() => {
            console.log('Redirecionando para dashboard...');
            // Redirecionar imediatamente após sucesso
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error('Erro completo no login com Google:', error);
            console.log('Código do erro:', error.code);
            console.log('Mensagem do erro:', error.message);
            
            let errorMessage = 'Erro ao fazer login com Google.';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Login cancelado pelo usuário.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup bloqueado. Por favor, permita popups para este site.';
            }
            
            showMessage(errorMessage, 'error');
        });
}

// Função de registro com email
function registerWithEmail(name, email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Salvar dados adicionais do usuário
            return db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                phone: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                storageUsed: 0,
                fileCount: {
                    images: 0,
                    videos: 0,
                    documents: 0,
                    audios: 0,
                    others: 0
                }
            });
        })
        .then(() => {
            console.log('Usuário registrado com sucesso');
            showMessage('Conta criada com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        })
        .catch((error) => {
            console.error('Erro no registro', error);
            showMessage('Erro ao criar conta: ' + error.message, 'error');
        });
}

// Verificar estado de autenticação
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Usuário já autenticado, redirecionando...', user);
        // Se usuário já está logado, redirecionar diretamente
        window.location.href = 'dashboard.html';
    }
});

// Função para mostrar mensagens (deve estar definida)
function showMessage(message, type) {
    // Sua implementação existente de showMessage
    console.log(`${type}: ${message}`);
}