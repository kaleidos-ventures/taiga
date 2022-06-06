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
const { v4 } = require('uuid');

const { smtpPort, host, apiPort, ethereal } = require('./config');

const { send } = require('./ws');
const { sendTestEmail } = require('./send-email');

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
          let previewUrl = '';

          if (ethereal) {
            try {
              const info = await sendTestEmail(
                parsed.from.text,
                parsed.to.text,
                parsed.subject,
                parsed.text,
                parsed.html
              );

              previewUrl = nodemailer.getTestMessageUrl(info);
            } catch (err) {
              console.error(
                `Failed to create a testing account. ${err.message}`
              );
            }
          }

          const id = v4();
          const localPreview = `${host}/emails/${id}`;

          console.log(`
Id: ${id}
Subject: ${parsed.subject}
To: ${parsed.to.text}
Preview URL: ${previewUrl}
Local preview URL: ${localPreview}`);

          emails.push({
            id,
            from: parsed.from.text,
            to: parsed.to.text,
            subject: parsed.subject,
            text: parsed.text,
            html: parsed.html,
            preview: previewUrl,
            localPreview,
          });

          send(
            JSON.stringify({
              previewUrl,
              subject: parsed.subject,
              to: parsed.to.text,
              localPreview,
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
