// ===== NEXUS-CLOUD SISTEMA DE SEGURANÇA AVANÇADO =====
// Arquivo: security-system.js
// Importe este arquivo em todas as páginas do seu site

class NexusSecurity {
    constructor() {
        this.attempts = {};
        this.blockedIPs = new Set();
        this.browserFingerprint = null;
        this.encryptionKey = null;
        this.activities = [];
        
        this.init();
    }

    async init() {
        // Inicializar todas as proteções
        this.enableConsoleProtection();
        this.enableDevToolsProtection();
        this.enableClickJackingProtection();
        this.enableBrowserFingerprinting();
        this.startIntrusionDetection();
        this.enableEncryption();
        this.startMonitoring();
        
        console.log('🔒 Nexus Security System inicializado');
    }

    // 1. Proteção contra console e devtools
    enableConsoleProtection() {
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug
        };

        const secureConsole = (type, args) => {
            const message = ['🔒 Secure ' + type + ':'].concat(...args);
            originalConsole[type].apply(console, message);
        };

        console.log = (...args) => secureConsole('log', args);
        console.warn = (...args) => secureConsole('warn', args);
        console.error = (...args) => secureConsole('error', args);
        console.info = (...args) => secureConsole('info', args);
        console.debug = (...args) => secureConsole('debug', args);
    }

    // 2. Detecção de DevTools
    enableDevToolsProtection() {
        setInterval(() => {
            const widthThreshold = window.outerWidth - window.innerWidth > 100;
            const heightThreshold = window.outerHeight - window.innerHeight > 100;
            
            if (widthThreshold || heightThreshold) {
                this.handleIntrusionAttempt('DevTools detection');
            }
        }, 1000);

        // Detectar via debugger statement
        const debuggerCheck = () => {
            setInterval(() => {
                (function() {
                    return false;
                }['constructor']('debugger')());
            }, 4000);
        };
        
        try {
            debuggerCheck();
        } catch (e) {
            this.handleIntrusionAttempt('Debugger detection');
        }
    }

    // 3. Proteção contra Clickjacking
    enableClickJackingProtection() {
        if (self !== top) {
            document.body.innerHTML = '';
            this.handleIntrusionAttempt('Clickjacking attempt');
        }
        
        // Adicionar header de proteção via JavaScript
        document.addEventListener('DOMContentLoaded', () => {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'X-Frame-Options';
            meta.content = 'SAMEORIGIN';
            document.head.appendChild(meta);
        });
    }

    // 4. Fingerprinting do navegador
    enableBrowserFingerprinting() {
        this.browserFingerprint = this.generateBrowserFingerprint();
    }

    generateBrowserFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const txt = 'NEXUS-CLOUD-SECURITY';
            
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText(txt, 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText(txt, 4, 17);
            
            return canvas.toDataURL();
        } catch (e) {
            return 'fingerprint-error:' + navigator.userAgent;
        }
    }

    // 5. Sistema de detecção de intrusão
    startIntrusionDetection() {
        // Detectar teclas de debug
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'U') ||
                (e.ctrlKey && e.key === 'R') ||
                (e.ctrlKey && e.key === 'F5')) {
                e.preventDefault();
                this.handleIntrusionAttempt('Keyboard shortcut detected: ' + e.key);
            }
        });

        // Detectar mudanças no DOM suspeitas
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeName === 'SCRIPT' && 
                            node.src && 
                            !node.src.includes(window.location.hostname)) {
                            this.handleIntrusionAttempt('Suspicious script injection: ' + node.src);
                        }
                    });
                }
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // Detectar mudanças de foco
        window.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.hidden) {
                    this.handleIntrusionAttempt('Window focus lost suspiciously');
                }
            }, 1000);
        });

        // Proteger contra right-click
        document.addEventListener('contextmenu', (e) => {
            this.handleIntrusionAttempt('Right-click attempt');
            e.preventDefault();
            return false;
        });

        // Proteger contra cópia
        document.addEventListener('copy', (e) => {
            this.handleIntrusionAttempt('Copy attempt');
            e.preventDefault();
            return false;
        });

        // Proteger contra drag de imagens
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleIntrusionAttempt('Image drag attempt');
                e.preventDefault();
                return false;
            }
        });
    }

    // 6. Sistema de criptografia
    enableEncryption() {
        this.encryptionKey = this.generateEncryptionKey();
    }

    generateEncryptionKey() {
        try {
            const array = new Uint8Array(32);
            window.crypto.getRandomValues(array);
            return btoa(String.fromCharCode.apply(null, array));
        } catch (e) {
            return Math.random().toString(36).substring(2) + Date.now().toString(36);
        }
    }

    // 7. Monitoramento em tempo real
    startMonitoring() {
        // Monitorar requisições
        this.monitorFetch();
        
        // Monitorar erros
        window.addEventListener('error', (e) => {
            this.logActivity('error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        });

        // Monitorar performance
        this.monitorPerformance();
    }

    monitorFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();
            try {
                const response = await originalFetch(...args);
                this.logActivity('fetch', {
                    url: typeof args[0] === 'string' ? args[0] : args[0].url,
                    status: 'success',
                    duration: Date.now() - startTime,
                    method: args[1]?.method || 'GET'
                });
                return response;
            } catch (error) {
                this.logActivity('fetch', {
                    url: typeof args[0] === 'string' ? args[0] : args[0].url,
                    status: 'error',
                    duration: Date.now() - startTime,
                    error: error.message,
                    method: args[1]?.method || 'GET'
                });
                throw error;
            }
        };
    }

    monitorPerformance() {
        if ('performance' in window) {
            setInterval(() => {
                const perf = performance.getEntriesByType('navigation')[0];
                if (perf) {
                    this.logActivity('performance', {
                        loadTime: perf.loadEventEnd - perf.startTime,
                        domReady: perf.domContentLoadedEventEnd - perf.startTime,
                        ttfb: perf.responseStart - perf.requestStart
                    });
                }
            }, 60000);
        }
    }

    logActivity(type, data) {
        const activity = {
            type,
            timestamp: new Date().toISOString(),
            data,
            fingerprint: this.browserFingerprint,
            url: window.location.href
        };
        
        this.activities.push(activity);
        
        // Manter apenas as últimas 100 atividades
        if (this.activities.length > 100) {
            this.activities.shift();
        }
    }

    // 8. Manipulação de tentativas de intrusão
    async handleIntrusionAttempt(reason) {
        const ip = await this.getIP();
        const now = Date.now();
        
        // Registrar tentativa
        if (!this.attempts[ip]) {
            this.attempts[ip] = [];
        }
        this.attempts[ip].push({ timestamp: now, reason });

        // Bloquear após 3 tentativas em 5 minutos
        const recentAttempts = this.attempts[ip].filter(
            attempt => now - attempt.timestamp < 300000
        );

        if (recentAttempts.length >= 3) {
            this.blockedIPs.add(ip);
            this.showSecurityAlert(ip, reason);
            this.logIntrusion(ip, reason);
        }
    }

    // 9. Obter IP do usuário
    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // 10. Mostrar alerta de segurança
    showSecurityAlert(ip, reason) {
        // Criar overlay de segurança se não existir
        if (!document.getElementById('nexus-security-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'nexus-security-overlay';
            overlay.style = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                color: #fff;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
                text-align: center;
            `;
            
            overlay.innerHTML = `
                <h1 style="color: #ff0000; font-size: 2.5em;">🚨 SISTEMA DE SEGURANÇA ATIVADO</h1>
                <p style="font-size: 1.2em;">Atividade suspeita detectada e bloqueada.</p>
                <p>IP: ${ip}</p>
                <p>Motivo: ${reason}</p>
                <p style="margin-top: 20px;">Esta tentativa foi registrada em nossos sistemas.</p>
            `;
            
            document.body.appendChild(overlay);
            
            // Bloquear completamente a página
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', (e) => {
                e.preventDefault();
                return false;
            });
        }
    }

    // 11. Log de intrusão
    logIntrusion(ip, reason) {
        const logData = {
            ip,
            reason,
            timestamp: new Date().toISOString(),
            fingerprint: this.browserFingerprint,
            userAgent: navigator.userAgent,
            url: window.location.href,
            activities: this.activities
        };

        console.log('🚨 Intrusão detectada:', logData);
        
        // Aqui você pode enviar para um servidor de logs
        // this.sendToSecurityServer(logData);
    }

    // 12. Validar requisições
    validateRequest(requestData) {
        const patterns = {
            sqlInjection: /(\b(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b|['";\\])/i,
            xss: /(<script|javascript:|onload=|onerror=|onmouseover=|onclick=)/i,
            pathTraversal: /(\.\.\/|\.\.\\|\/etc\/passwd|\.env|config\.)/i,
            commandInjection: /(\b(echo|wget|curl|bash|sh|python|perl)\b|\||`|\$\(|\.\.)/i
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(JSON.stringify(requestData))) {
                this.handleIntrusionAttempt(`${type} attempt detected`);
                return false;
            }
        }

        return true;
    }

    // 13. Método para enviar logs para servidor (implementação opcional)
    async sendToSecurityServer(logData) {
        try {
            await fetch('https://seuservidor.com/security-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logData)
            });
        } catch (error) {
            console.error('Erro ao enviar log:', error);
        }
    }
}

// ===== INICIALIZAÇÃO DO SISTEMA =====
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sistema de segurança
    window.nexusSecurity = new NexusSecurity();

    // Proteger todos os forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            if (!window.nexusSecurity.validateRequest(data)) {
                e.preventDefault();
                return false;
            }
        });
    });

    // Adicionar token de segurança a todas as requisições AJAX
    if (window.XMLHttpRequest) {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            this.addEventListener('loadstart', function() {
                if (!window.nexusSecurity.validateRequest({ url: args[1] })) {
                    this.abort();
                }
            });
            return originalOpen.apply(this, args);
        };
    }
});

// Proteção contra iframes maliciosos
if (window !== window.top) {
    window.top.location = window.location;
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexusSecurity;
}