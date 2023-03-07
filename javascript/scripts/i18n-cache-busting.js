/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

const crypto = require('crypto');
const fs = require('fs');
const { globSync } = require('glob');

function generateChecksum(str, algorithm, encoding) {
  return crypto
    .createHash(algorithm || 'md5')
    .update(str, 'utf8')
    .digest(encoding || 'hex');
}

const result = {};

globSync(`apps/taiga/src/assets/i18n/**/*.json`).forEach((path) => {
  const [_, lang] = path.split('src/assets/i18n/');
  const content = fs.readFileSync(path, { encoding: 'utf-8' });
  result[lang.replace('.json', '')] = generateChecksum(content);
});

fs.writeFileSync(
  'apps/taiga/src/assets/i18n/i18n-cache-busting.json',
  JSON.stringify(result)
);
