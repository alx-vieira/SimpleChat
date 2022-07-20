const express = require ('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

server.listen(3000);

app.use(express.static(path.join(__dirname, 'public')));

// O socket-io trabalha com emissão (emit) de mensagem e recebimento (listen) de mensagem

// FAZENDO A CONEXÃO

// Variável apra armazenar os usuários logados
let connectedUsers = [];

// Listenner de conexão - Quando uma pessoa entra na minha página ele detecta a conexão e 
    // executa a função. O que tem nessa função roda em toda a conexão que for feita, ou seja, roda
    // toda vez que alguém entra na página e gera um socket para cada um
io.on('connection', (socket) => {
    console.log('Conexão detectada...');

    // fazendo o listenner requisição de entrada na sala (passo como parâmetro o nome do usuário)
    socket.on('join-request', (userName) => {
        // Essa conexão fica associada ao nome do usuario que ele digitar
        socket.userName = userName;
        
        // Adiciono o nome do usuário na lista de pessoas conectadas
        connectedUsers.push(userName);
        console.log("USUÁRIO CONECTADO: ", connectedUsers);
        
        // Emito um evento informando que o usuário foi autorizado a entrar e envio a lista de usuários atualizada
        socket.emit('user-ok', connectedUsers);
        
        // Envio para todos, menos para o usuário, a mensagem que uma pessoa entrou (broadcast) e atualizo a lista de pessoas na sala
        socket.broadcast.emit('list-update', {
            joined: userName, //Entrou
            list: connectedUsers //Lista de usuários atualizada
        });
    });

    // Listenner para quando alguém desconecta da sala (remover da lista)
    socket.on('disconnect', () => {
        // Remove a pessoa da lista (forma fácil de remover algo de um array)
        connectedUsers = connectedUsers.filter(u => u != socket.userName);
        console.log(connectedUsers);

        // Emito um broadcast com update em list-update
        socket.broadcast.emit('list-update', {
            left: socket.userName, //Quem saiu
            list: connectedUsers //Lista de usuários atualizada
        });
    });

    // Listener para ouvir o envio de mensagem do usuario e então repassar aos demais usuarios
    socket.on('send-msg', (text) => {
        // Envio um objeto com o nome de quem enviou a mensagem e a mensagem
        let obj = {
            userName: socket.userName,
            message: text
        };
        // Envio a mensagem para o usuário destinatário primeiro. Mas posso enviar para a propria 
            // tela direto do usuario sem precisar que o servidor emita dois eventos e por aqui envio só para todo mundo
        // socket.emit('show-msg', obj);
        // Envio para todo mundo depois
        socket.broadcast.emit('show-msg', obj);
    });

});