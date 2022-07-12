/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { BadgeComponent } from './badge.component';
import { BadgeModule } from './badge.module';

export default ConfigureStory({
  title: 'Badge',
  component: BadgeComponent,
  extraModules: [BadgeModule],
});

const baseArgs = {
  label: 'label',
};

const baseArgTypes = {
  color: {
    defaultValue: 'gray',
    options: [
      'primary',
      'secondary',
      'white',
      'black',
      'gray',
      'info',
      'green',
      'ok',
      'yellow',
      'warning',
      'red',
      'notice',
    ],
    control: { type: 'select' },
  },
  icon: {
    defaultValue: '',
    options: ['', 'folder', 'help', 'discover', 'bell', 'taiga-logo'],
    control: { type: 'select' },
  },
  size: {
    defaultValue: 'm',
    options: ['s', 'm', 'l'],
    control: { type: 'select' },
  },
};

export const Badge = ConfigureTemplate({
  template: `
  <div class="story-small-container">
    <tg-ui-badge [label]="label" [icon]="icon" [size]="size" [color]="color"></tg-ui-badge>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes,
});
