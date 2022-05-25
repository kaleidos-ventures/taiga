/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const { initWsServer } = require('./ws');
const { initMailServer } = require('./server');
require('./api-server');

/*
.env example

TAIGA_EMAIL = '{
  "BACKEND": "smtp",
  "DEFAULT_SENDER": "from@example.com",
  "SERVER": "0.0.0.0",
  "USERNAME": "",
  "PASSWORD": "",
  "PORT": 2525,
  "USE_TLS": false,
  "USE_SSL": false,
  "SSL_CERTFILE": false
}'
*/

function main() {
  initWsServer();
  initMailServer();
}

main();
