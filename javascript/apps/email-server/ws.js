/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const WebSocket = require('ws');
const WS_PORT = 8090;

let wsClients = [];

function addClient(ws) {
  wsClients.push(ws);
}

function removeClient(ws) {
  wsClients = wsClients.filter((it) => it !== ws);
}

module.exports.send = (msg) => {
  wsClients.forEach((ws) => {
    ws.send(msg);
  });
};

module.exports.initWsServer = () => {
  const wss = new WebSocket.Server({ port: WS_PORT });
  wss.on('connection', (ws) => {
    addClient(ws);

    ws.on('close', () => {
      removeClient(ws);
    });
  });
};
