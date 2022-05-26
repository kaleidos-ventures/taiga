/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const { user, pass } = require('./config');
const nodemailer = require('nodemailer');

const etherealAuth = {
  smtp: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
  },
  user,
  pass,
};

module.exports.sendTestEmail = (from, to, subject, text, html) => {
  const send = (account) => {
    console.log('Credentials obtained, sending message...');
    // Create a SMTP transporter object
    let transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });

    // Message object
    let message = {
      from,
      to,
      subject,
      text,
      html,
    };

    return transporter.sendMail(message);
  };

  return new Promise((resolve, reject) => {
    if (user && pass) {
      resolve(send(etherealAuth));
    } else {
      // Generate SMTP service account from ethereal.email
      nodemailer.createTestAccount((err, account) => {
        if (err) {
          reject(err.message);
          return;
        }

        resolve(send(account));
      });
    }
  });
};
