/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const nodemailer = require('nodemailer');

const { send } = require('./ws');
const { sendTestEmail } = require('./send-email');

const SMTP_PORT = 2525;

const emailUrls = [];

module.exports.initMailServer = () => {
  const server = new SMTPServer({
    secure: false,
    authOptional: true,
    onData(stream, session, callback) {
      simpleParser(stream, {}, async (err, parsed) => {
        if (err) {
          console.error(err);
        } else {
          const info = await sendTestEmail(
            parsed.from.text,
            parsed.to.text,
            parsed.subject,
            parsed.text,
            parsed.html
          );

          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.log('Preview URL: %s', previewUrl);

          emailUrls.push(previewUrl);

          send(JSON.stringify({ previewUrl }));
        }
      });

      stream.on('end', callback);
    },
  });

  server.listen(SMTP_PORT, () => {});
};

module.exports.getPreviews = () => {
  return emailUrls;
};
