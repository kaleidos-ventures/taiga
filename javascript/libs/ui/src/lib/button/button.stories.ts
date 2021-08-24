/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ConfigureStory, ConfigureTemplate, EmptyComponent } from '@storybook-helper';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';

export default ConfigureStory({
  title: 'Buttons',
  component: EmptyComponent,
  extraModules: [ TuiButtonModule, TuiSvgModule ],
});

export const Primary = ConfigureTemplate({
  template: `
  <button
    appearance="tertiary-button"
    tuiButton
    icon="folder"
    type="button">
    test1
  </button>

  <button
    appearance="primary"
    tuiButton
    icon="folder"
    type="tuiIconButton">
    test2
  </button>
  `,
  args: {}
});
