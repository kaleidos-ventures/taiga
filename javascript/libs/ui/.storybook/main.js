/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

const rootMain = require('../../../.storybook/main');
module.exports = {
  ...rootMain,
  stories: [
    ...(rootMain.stories ?? []),
    '../**/*.stories.mdx',
    '../**/*.stories.@(js|jsx|ts|tsx)',
  ],
  staticDirs: [
    {
      from: '../../../apps/taiga/src/assets',
      to: '/assets',
    },
  ],
  addons: ['@storybook/addon-essentials', ...rootMain.addons],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};
