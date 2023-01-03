/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

// https://ngneat.github.io/transloco/docs/recipes/google-translate-integration

const fetch = require('node-fetch');
const glob = require('glob');
const { Translate } = require('@google-cloud/translate').v2;
const projectId = process.env.projectId ?? '';
const defaultSourceLang = 'en-US';
const fs = require('fs');

const i18Dir = './apps/taiga/src/assets/i18n';

function createLocalFiles(codes) {
  return new Promise((resolve) => {
    glob(
      `./apps/taiga/src/assets/i18n/**/${defaultSourceLang}.json`,
      (error, files) => {
        files.forEach(async (file) => {
          const data = fs.readFileSync(file, 'utf8');

          console.log(data);

          Object.values(codes).forEach((local) => {
            if (local === defaultSourceLang) return;

            const p = file.replace(defaultSourceLang, local);

            // create files in english
            fs.writeFileSync(p, data, { encoding: 'utf8', flag: 'w' });

            if (fs.existsSync(p)) {
              console.log('exists ' + p);
            } else {
              console.log('write', p);
              // fs.writeFileSync(p, '', { encoding: 'utf8', flag: 'w' });
            }
          });
        });
      }
    );

    resolve();
  });
}

async function init() {
  const response = await fetch('http://localhost:8000/api/v2/system/languages');
  let codes = {};
  (await response.json()).forEach((it) => {
    codes[it.englishName] = it.code;
  });

  await createLocalFiles(codes);

  if (!projectId) {
    return;
  }

  const googleTranslate = new Translate({ projectId });

  let sourceFile = (local) => {
    try {
      return JSON.parse(fs.readFileSync(`${i18Dir}/${local}.json`, 'utf8'));
    } catch (e) {
      return null;
    }
  };

  let getLocals = () => {
    return new Promise((resolve, reject) => {
      const locals = [];
      fs.readdir(i18Dir, (err, files) => {
        files.forEach((file) => {
          if (file === `${defaultSourceLang}.json`) return;
          file = file.replace(/\.json/, '');
          locals.push(file);
        });
        resolve(locals);
      });
    });
  };

  let trasnlate = async (word, local) => {
    const [translation] = await googleTranslate.translate(word, local);

    return cleanProbCharactersV2(translation);
  };

  const cleanProbCharactersV2 = (i_string) => {
    i_string = i_string.replace(/'/gi, '');
    i_string = i_string.replace(/"/gi, '');
    i_string = i_string.replace(/}/gi, '');
    i_string = i_string.replace(/{/gi, '');
    i_string = i_string.replace(/\)/gi, '');
    i_string = i_string.replace(/\r/gi, '');
    i_string = i_string.replace(/\n/gi, '');
    i_string = i_string.replace(/()/gi, '');
    return i_string;
  };

  const localSource = sourceFile(defaultSourceLang);

  (async function asyncConnect() {
    try {
      const languages = await getLocals(3000);
      for (let i = 0; i < languages.length; i++) {
        let final = {};
        const local = languages[i];
        console.log('processing local ' + local + ' >>>');
        const destlSource = sourceFile(local);
        if (destlSource) {
          final = destlSource;
        }
        for (section in localSource) {
          if (!final[section]) final[section] = {};
          const words = localSource[section];
          for (word in words) {
            if (
              destlSource &&
              destlSource[section] &&
              destlSource[section][word]
            ) {
              final[section][word] = destlSource[section][word];
            } else {
              console.log('   >>> ' + section + ' ' + words[word]);
              const newWord = await trasnlate(words[word], local);
              console.log('       ### translated to ' + newWord);
              final[section][word] = newWord;
            }
          }
        }
        const f = i18Dir + '/' + local + '.json';
        try {
          fs.writeFileSync(f, JSON.stringify(final, null, '\t'), {
            encoding: 'utf8',
            flag: 'w',
          });
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.log('problem encountered ' + err);
    }
  })();
}

init();
