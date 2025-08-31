// Função para criar/verificar usuário no Firestore
function checkUserExists(user) {
    return db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (!doc.exists) {
                // Criar usuário se não existir
                return db.collection('users').doc(user.uid).set({
                    name: user.displayName || '',
                    email: user.email,
                    phone: '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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
            }
        })
        .catch((error) => {
            console.error('Erro ao verificar/criar usuário:', error);
        });
}

// Função para atualizar o último login
function updateLastLogin(userId) {
  return db.collection('users').doc(userId).update({
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// Modificar a função de login para incluir a atualização
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

// Modificar também o login com Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      console.log('Login com Google bem-sucedido', result.user);
      // Verificar se usuário já existe e atualizar último login
      return checkUserExists(result.user);
    })
    .then(() => {
      showMessage('Login com Google realizado com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    })
    .catch((error) => {
      console.error('Erro no login com Google', error);
      showMessage('Erro ao fazer login com Google: ' + error.message, 'error');
    });
}

// Atualizar a função checkUserExists para incluir último login
function checkUserExists(user) {
  return db.collection('users').doc(user.uid).get()
    .then((doc) => {
      if (!doc.exists) {
        // Criar usuário se não existir
        return db.collection('users').doc(user.uid).set({
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
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
    });
}

// Modificar a função registerWithEmail para usar a função acima
function registerWithEmail(name, email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Salvar dados adicionais do usuário
            return db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                phone: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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