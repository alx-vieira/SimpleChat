// Client Side
// Iniciar a conexão (Se for conexão com outro servidor coloco dentro dos parentes o endereço)
const socket = io();

let userList = [];
let userName = '';

let loginPage = document.querySelector('#loginPage');
let chatPage = document.querySelector('#chatPage');

let loginInput = document.querySelector('#loginNameInput');
let textInput = document.querySelector('#chatTextInput');

loginPage.style.display = 'flex';
chatPage.style.display = 'none';

// Função para atualizar e renderizar a lista e usuários na tela
function renderUserList() {
    let ul = document.querySelector('.userList');
    ul.innerHTML = '';

    userList.forEach(i => {
        ul.innerHTML += '<li>'+i+'</li>';
    });
}

// Função para exibir uma mensagem no chat
function addMessage(type, user, msg) {
    let ul = document.querySelector('.chatList');

    switch(type) {
        case 'status':
            ul.innerHTML += '<li class="m-status">'+msg+'</li>';
        break;
        case 'msg':
            if(userName === user) {
                ul.innerHTML += '<li class="m-text"><span class="me">'+user+'</span> '+msg+'</li>';
            } else {
                ul.innerHTML += '<li class="m-text"><span>'+user+'</span> '+msg+'</li>';
            }
        break;
    }

    // Depois de adicionar a mensagem tenho que rolar a barra de rolagem automaticamente
    ul.scrollTop = ul.scrollHeight;
}

// Adicionar a ação para quando o usuário apertar ENTER no formulário de login ele fazer o login
loginInput.addEventListener('keyup', (e) => {
    // Verificoo se a tecla que o usuário apertou é o ENTER(tecla 13)
    if(e.keyCode === 13) {
        // Limpo os espaços vazios que possa ter
        let name = loginInput.value.trim();
        // verifico se não é vazio
        if(name != '') {
            userName = name;
            // Mudo o titulo da página para o nome de quem está conversando
            document.title = 'Chat ('+userName+')';
            // Envio para o servidor o nome do usuário
            socket.emit('join-request', userName);
        }
    }
});

// Criar um listenner para ouvir o evento de confirmação da aprovação do usuário enviado pelo servidor
socket.on('user-ok', (list) => {
    // Assim que receber a lista de usuarios logados
    loginPage.style.display = 'none';
    chatPage.style.display = 'flex';
    chatTextInput.focus();

    // Add mensagem de novo usuário conectado
    addMessage('status', null, 'Conectado!');

    userList = list;
    // Rodo uma função para renderizar a lista atualizada de usuários na página
    renderUserList();
});

// Criar listenner para ouvir evento do envio de mensagem pelo usuário e enviar ao servidor
textInput.addEventListener('keyup', (e) => {
    if(e.keyCode === 13) {
        let text = chatTextInput.value.trim(); //Pego a mensagem e limpo os espaços em branco
        chatTextInput.value = ''; //Limpo o campo para novas mensagens

        if(text != '') {
            //Adiciono a mensagem na tela do usuario diretamente por ele mesmo sem precisar vir do servidor
            addMessage('msg', userName, text);
            // Envio para o servidor e ele envia para todo mundo
            socket.emit('send-msg', text);
        }
    }
})

// Atualiza a lista de usuários quando alguém entra ou sai da sala
socket.on('list-update', (data) => {
    if(data.joined) {
        addMessage('status', null, data.joined+' entrou no chat.');
    }

    if(data.left) {
        addMessage('status', null, data.left+' saiu do chat.');
    }

    userList = data.list;
    renderUserList();
});

// Listenner para receber as mensagens
socket.on('show-msg', (data) => {
   addMessage('msg', data.userName, data.message)
});

// Listener para quando cai a conexão
socket.on('disconnect', () => {
    addMessage('status', null, 'Você foi desconectado');
    userList = [];
    renderUserList();
});

// Como a pessoa vai querer ficar conectando, enquanto estiver sem conexão mostro um erro para ela
    // Não funcionou...
socket.io.on("reconnect_error", (error) => {
    addMessage('status', null, 'Tentando reconectar...');
});

socket.io.on('reconnect', (attempt) => {
    addMessage('status', null, 'Reconectado...');

    if(userName != '') {
        socket.emit('join-request', userName);
    }
});