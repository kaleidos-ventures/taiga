/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const { v4 } = require('uuid');

const { smtpPort, host } = require('./config');

const { send } = require('./ws');

const emails = [];

module.exports.initMailServer = () => {
  const server = new SMTPServer({
    secure: false,
    authOptional: true,
    onData(stream, session, callback) {
      simpleParser(stream, {}, async (err, parsed) => {
        if (err) {
          console.error(err);
        } else {
          const id = v4();
          const previewUrl = `${host}/emails/${id}`;

          console.log(`
Id: ${id}
Subject: ${parsed.subject}
To: ${parsed.to.text}
Preview URL: ${previewUrl}`);

          emails.push({
            id,
            from: parsed.from.text,
            to: parsed.to.text,
            subject: parsed.subject,
            text: parsed.text,
            html: parsed.html,
            previewUrl,
          });

          send(
            JSON.stringify({
              previewUrl,
              subject: parsed.subject,
              to: parsed.to.text,
              previewUrl,
            })
          );
        }
      });

      stream.on('end', callback);
    },
  });

  server.listen(smtpPort, () => {});
};

module.exports.getEmails = () => {
  return emails;
};
