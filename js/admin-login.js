// Verificar se já está logado como admin
window.addEventListener('DOMContentLoaded', function() {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        // Verificar se o token é válido
        const loginTime = new Date(localStorage.getItem('adminLoginTime'));
        const now = new Date();
        const diffHours = Math.abs(now - loginTime) / 36e5;
        
        if (diffHours < 4) { // Token válido por 4 horas
            window.location.href = 'admin-dashboard.html';
        } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminLoginTime');
        }
    }
});

// Login administrativo
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPassword').value;
    
    // Credenciais fixas
    const adminUsername = 'Yt@llo-Dr1v3';
    const adminPassword = '$3cur3dr1v3';
    
    if (!username || !password) {
        showAdminMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (username === adminUsername && password === adminPassword) {
        // Gerar token de autenticação
        const token = generateAdminToken();
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminLoginTime', new Date().toISOString());
        
        showAdminMessage('Login bem-sucedido! Redirecionando...', 'success');
        
        // Redirecionar para o dashboard admin após 1 segundo
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
    } else {
        showAdminMessage('Credenciais administrativas incorretas!', 'error');
    }
});

// Gerar token de administração
function generateAdminToken() {
    return 'admin_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// Mostrar mensagens para o admin
function showAdminMessage(message, type) {
    // Remove mensagens existentes
    const existingAlert = document.querySelector('.admin-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `admin-alert admin-alert-${type}`;
    alertDiv.textContent = message;
    
    // Estilos para a mensagem
    alertDiv.style.padding = '12px';
    alertDiv.style.margin = '0 0 20px 0';
    alertDiv.style.borderRadius = '8px';
    alertDiv.style.fontWeight = '500';
    alertDiv.style.textAlign = 'center';
    
    if (type === 'error') {
        alertDiv.style.background = 'rgba(239, 68, 68, 0.2)';
        alertDiv.style.color = '#ef4444';
        alertDiv.style.border = '1px solid rgba(239, 68, 68, 0.5)';
    } else {
        alertDiv.style.background = 'rgba(16, 185, 129, 0.2)';
        alertDiv.style.color = '#10b981';
        alertDiv.style.border = '1px solid rgba(16, 185, 129, 0.5)';
    }
    
    // Inserir após o título
    const form = document.getElementById('adminLoginForm');
    if (form) {
        form.parentNode.insertBefore(alertDiv, form);
    }
}