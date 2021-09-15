/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const path = require('path');

const getConfig = () => {
  return {
    'plugins': [
      require('postcss-import')({
        from: "/src/styles.css",
        path: [
          path.resolve(__dirname, 'apps/taiga/src/app/styles'),
        ]
      }),
      require('postcss-mixins'),
      require('postcss-preset-env')({
        stage: 0,
        features: {
          'logical-properties-and-values': false
        }
      })
    ]
  };
}

exports.getConfig = getConfig;
