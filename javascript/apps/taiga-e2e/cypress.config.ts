/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';
import setupNodeEvents from './src/plugins/index';

const cypressJsonConfig = {
  fileServerFolder: '.',
  fixturesFolder: './src/fixtures',
  video: true,
  videosFolder: '../../dist/cypress/apps/taiga-e2e/videos',
  screenshotsFolder: '../../dist/cypress/apps/taiga-e2e/screenshots',
  chromeWebSecurity: false,
  experimentalSessionSupport: true,
  experimentalSessionAndOrigin: true,
  specPattern: 'src/e2e/**/*.cy.{js,jsx,ts,tsx}',
  supportFile: 'src/support/e2e.ts',
};
export default defineConfig({
  e2e: {
    ...nxE2EPreset(__dirname),
    ...cypressJsonConfig,
    setupNodeEvents,
    testIsolation: true,
  },
});
