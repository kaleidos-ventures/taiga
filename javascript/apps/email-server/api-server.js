/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const { getEmails } = require('./server');
const { apiPort } = require('./config');

app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', __dirname);

app.get('/emails', function (req, res) {
  const emails = getEmails();

  res.json({ emails });
});

app.get('/emails-previews', function (req, res) {
  const emails = getEmails().map((it) => {
    return {
      to: it.to,
      subject: it.subject,
      previewUrl: it.previewUrl,
    };
  });

  res.json({ emails });
});

app.get('/emails/:emailId', function (req, res) {
  const email = getEmails().find((it) => {
    return it.id === req.params.emailId;
  });

  if (email) {
    res.render('./email-preview', {
      email,
    });
  } else {
    res.status(404);
    res.type('txt').send('Not found');
  }
});

app.listen(apiPort);
