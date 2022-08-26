/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const configArguments = process.argv.slice(2);

let wsPort = 8090;
let smtpPort = 2525;
let apiPort = 3000;
let user = '';
let pass = '';
let host = `http://localhost:${apiPort}`;

configArguments.forEach((arg) => {
  if (arg.startsWith('--ws=')) {
    wsPort = arg.split('=')[1];
  } else if (arg.startsWith('--smtp=')) {
    smtpPort = arg.split('=')[1];
  } else if (arg.startsWith('--api=')) {
    apiPort = arg.split('=')[1];
  } else if (arg.startsWith('--user=')) {
    user = arg.split('=')[1];
  } else if (arg.startsWith('--pass=')) {
    pass = arg.split('=')[1];
  } else if (arg.startsWith('--host=')) {
    host = arg.split('=')[1];
  }
});

module.exports = {
  wsPort,
  smtpPort,
  apiPort,
  user,
  pass,
  host,
};
