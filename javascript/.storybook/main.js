/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

module.exports = {
  stories: [],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-controls',
    '@storybook/addon-links',
    '@storybook/addon-actions',
    '@storybook/addon-a11y',
    '@storybook/addon-notes',
  ],
  webpackFinal: async (config, { configType }) => {
    if (config?.module?.rules) {
      config.module.rules.push({
        test: /\.css$/,
        loader: 'postcss-loader',
      });
    }

    return config;
  },
};
