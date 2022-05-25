/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const { getEmails } = require('./send-email');
const { getPreviews } = require('./server');

app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/emails', function (req, res) {
  const emails = getEmails();

  res.json({ emails });
});

app.get('/emails-previews', function (req, res) {
  const emails = getPreviews();

  res.json({ emails });
});

app.listen(3000);
