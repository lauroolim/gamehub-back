const io = require('socket.io-client').io;
require('dotenv').config();

const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

// Verifique se o token JWT está definido
const token = process.env.JWT_TOKEN;
if (!token) {
    console.error('Token JWT não definido. Verifique a variável de ambiente JWT_TOKEN.');
    process.exit(1);
}

// Defina a URL do WebSocket e o token
const socket = io('http://localhost:3000/chat', {
    auth: {
        token: `${token}`,
    },
    reconnection: false, // Desativar reconexão automática para controle manual
});

// Função para enviar uma mensagem
function sendMessage(senderId, receiverId, content) {
    socket.emit('send_message', { senderId, receiverId, content });
}

// Função para tentar reconectar manualmente
function tryReconnect() {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        setTimeout(() => {
            socket.connect(); // Tente reconectar após um pequeno atraso
        }, 1000); // 1 segundo de atraso
    } else {
        console.error('Número máximo de tentativas de reconexão atingido.');
    }
}

// Escute eventos de conexão
socket.on('connect', () => {
    console.log('Conectado ao WebSocket!');
    reconnectAttempts = 0; // Resetar tentativas de reconexão

    // Enviar uma mensagem após a conexão
    sendMessage(1, 2, 'Olá!'); // Envie uma mensagem apenas se os IDs forem válidos
});

// Escute eventos de recebimento de mensagens
socket.on('receive_message', (message) => {
    console.log('Mensagem recebida:', message);
});

// Escute eventos de desconexão
socket.on('disconnect', (reason) => {
    console.log(`Desconectado do WebSocket: ${reason}`);
    if (reason === 'io server disconnect') {
        tryReconnect();
    }
});

// Escute eventos de erro
socket.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
});

// Função para decodificar o token (apenas para demonstração)
function decodeToken(token) {
    // Aqui você pode adicionar lógica para decodificar o token, se necessário
    return {};
}

const decoded = decodeToken(token);
console.log('Token recebido:', `Bearer ${token}`);
console.log('Decodificando token:', decoded);