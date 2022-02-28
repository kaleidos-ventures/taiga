/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(path.join(__dirname, '../'));
const ROOT_PYTHON = path.resolve(
  path.join(__dirname, '../../python/apps/taiga/src/taiga/emails/templates')
);
const EXTNAMES = ['.ts', '.js', '.html', '.css', '.jinja'];
const EXCLUDE = ['node_modules', 'dist'];
const SEARCH_TEXT = 'Copyright (c)';

function getLicense() {
  return `
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.

Copyright (c) 2021-present Kaleidos Ventures SL
`;
}

function getCommentedText(text, ext, filename) {
  if (ext === '.html' || filename.includes('.html.jinja')) {
    return `<!--${text}-->\n\n`;
  } else if (ext === '.css') {
    return `/*${text}*/\n\n`;
  } else if (ext === '.ts' || ext === '.js') {
    const splitedText = text.split('\n');

    return (
      splitedText
        .map((line, index) => {
          if (index === 0) {
            return '/**';
          } else if (index === splitedText.length - 1) {
            return ' */';
          }

          return ` * ${line}`.trimRight();
        })
        .join('\n') + '\n\n'
    );
  } else if (
    filename.includes('.txt.jinja') ||
    filename.includes('.subject.jinja')
  ) {
    return `{#${text}#}\n\n`;
  }

  return text;
}

function findFiles(directories, filepaths = []) {
  for (const directory of directories) {
    const files = fs.readdirSync(directory);
    for (let filename of files) {
      const filepath = path.join(directory, filename);
      if (fs.statSync(filepath).isDirectory() && !EXCLUDE.includes(filename)) {
        findFiles([filepath], filepaths);
      } else if (EXTNAMES.includes(path.extname(filename))) {
        filepaths.push(filepath);
      }
    }
  }
  return filepaths;
}

function prepend(filepath, text) {
  const data = fs.readFileSync(filepath);
  const fd = fs.openSync(filepath, 'w+');
  const insert = new Buffer.from(text);
  fs.writeSync(fd, insert, 0, insert.length, 0);
  fs.writeSync(fd, data, 0, data.length, insert.length);
  fs.close(fd, (err) => {
    if (err) throw err;
  });
}

console.info(' > Checking misseed license prephaces... ');

const files = findFiles([ROOT, ROOT_PYTHON]);
let fixed = 0;

for (let filepath of files) {
  const data = fs.readFileSync(filepath);
  if (!data.includes(SEARCH_TEXT)) {
    const filename = path.basename(filepath);
    let license = getLicense();
    license = getCommentedText(license, path.extname(filename), filename);

    prepend(filepath, license);

    console.info(
      '     Add license prephace to',
      '\033[1;96m',
      filepath,
      '\033[0;0m'
    );
    fixed++;
  }
}

if (fixed === 0) {
  console.info('   ...\033[1;32m', 'ALL OK', '\033[0;0m');
  process.exit(0);
} else {
  console.error('   ...\033[1;31m', `${fixed}`, '\033[0;0m fixed');
  process.exit(1);
}
