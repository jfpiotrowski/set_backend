const express = require('express');
const http = require('http');
const SetTracker = require('./setTracker');
const WebSocket = require('ws');
const uuid = require('uuid');
const url = require('url');

const app = new express();
const server = http.createServer(app);

const socketIdToGameId = {};
const gameIdToSocket = {};

const setTracker = new SetTracker({
  sendAll(topic, message) {
    Object.values(gameIdToSocket).forEach((client) => {
      try {
        client.send(JSON.stringify({ type: topic, data: message }));
      } catch (err) {
        console.log(err);
      }
    });
  },
  sendToID(id, topic, message) {
    try {
      gameIdToSocket[id].send(JSON.stringify({ targetId: id, type: topic, data: message }));
    } catch (err) {
      console.log(err);
    }
  },
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  ws.id = uuid.v4(); // eslint-disable-line 
  const gameId = setTracker.addNewSession();
  socketIdToGameId[ws.id] = gameId;
  gameIdToSocket[gameId] = ws;

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log(data);
    if (message.cmd === 'REQUEST_BOARD') {
      setTracker.requestBoard();
    }
    if (message.cmd === 'SUBMIT_SET') {
      setTracker.submitSet(socketIdToGameId[ws.id], message.data.set);
    }
    if (message.cmd === 'SUBMIT_NO_SET') {
      setTracker.submitNoSet(socketIdToGameId[ws.id], message.data.boardId);
    }
    if (message.cmd === 'SET_CONN_TYPE') {
      setTracker.setConnectionType(socketIdToGameId[ws.id], message.data.connType);
    }
    if (message.cmd === 'SET_NAME') {
      setTracker.setName(socketIdToGameId[ws.id], message.data.name);
    }
    if (message.cmd === 'REQUEST_ID') {
      try {
        // force to string since the id ends up being a string key
        ws.send(JSON.stringify({ type: 'ID', data: { id: socketIdToGameId[ws.id].toString() } }));
      } catch (err) {
        console.log(err);
      }
    }
  });

  ws.on('close', () => {
    console.log(`CLOSED ${ws.id}`);
    setTracker.removeSession(socketIdToGameId[ws.id]);
    delete gameIdToSocket[socketIdToGameId[ws.id]];
    delete socketIdToGameId[ws.id];
  });
});

server.on('upgrade', (request, socket, head) => {
  console.log('upgrayyed');
  const pathname = url.parse(request.url).pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});
/*
io.on('connection', (socket) => {
  const socketId = socket.id;
  const gameId = setTracker.addNewSession();

  socketIdToGameId[socketId] = gameId;
  gameIdToSocket[gameId] = socket;

  socket.on('name', (data) => {
    setTracker.setName(socketIdToGameId[socket.id], data);
  });

  socket.on('submitSet', (data) => {
    // set is array of 3 {index:<boardIndex>, card:{card object}}
    const set = JSON.stringify(data);
    setTracker.submitSet(socketIdToGameId[socket.id], set);
  });

  socket.on('sendBoard', () => {
    setTracker.broadcastBoard();
  });

  socket.on('disconnect', () => {
    delete gameIdToSocket[socketIdToGameId[socket.id]];
    delete socketIdToGameId[socket.id];
  });
});
*/
app.use(express.static('dist'));
app.get('/api/hello', (req, res) => res.send('Hello World!'));
server.listen(3000);

setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify({ type: 'KEEP-ALIVE', data: {} }));
        setTracker.requestBoard();
        setTracker.requestPlayers();
      } catch (err) {
        console.log(err);
      }
    }
  });
}, 1000);
