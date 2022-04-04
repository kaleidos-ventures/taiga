/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { TuiSvgModule } from '@taiga-ui/core';
import { ContextNotificationComponent } from './context-notification.component';

export default ConfigureStory({
  title: 'ContextNotification',
  component: ContextNotificationComponent,
  extraModules: [TuiSvgModule],
});

const baseArgs = {
  content: 'This a long sentence with customizable html content',
};

const baseArgTypes = {
  status: {
    defaultValue: 'info',
    options: ['info', 'error', 'warning', 'notice', 'success'],
    control: { type: 'select' },
  },
};

export const NotificationInline = ConfigureTemplate({
  template: `
  <div class="story-flex">
    <tg-ui-notification-inline [status]="status">
      <span>{{ content }}</span>
    </tg-ui-notification-inline>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes,
});
