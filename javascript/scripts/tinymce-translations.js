/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

/*
List of avaiable editor languages

Download de language pack https://www.tiny.cloud/get-tiny/language-packages/
unzip in javascript/apps/taiga/src/assets/editor/langs/
Run this script (generate file javascript/apps/taiga/src/app/modules/project/story-detail/components/story-detail-description/editor-languages.json with the available languages)
*/

const glob = require('glob');
const path = require('path');
const fs = require('fs');

async function init() {
  let files = await glob([`./apps/taiga/src/assets/editor/langs/*.js`]);

  files = files.map((it) => {
    return path.basename(it).split('.')[0];
  });

  fs.writeFileSync(
    `./apps/taiga/src/assets/editor/languages.json`,
    JSON.stringify(files),
    { encoding: 'utf8', flag: 'w' }
  );
}

init();
