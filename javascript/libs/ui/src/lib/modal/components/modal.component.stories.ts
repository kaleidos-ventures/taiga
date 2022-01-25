/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ModalComponent } from './modal.component';
import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { ModalModule } from '../modal.module';

export default ConfigureStory({
  title: 'ModalComponent',
  component: ModalComponent,
  extraModules: [ModalModule],
});

export const Primary = ConfigureTemplate({
  template: `
  <button (click)="open = !open">Open modal</button>
  <tg-ui-modal
    [open]="open"
    (requestClose)="open = !open">
    <h1>Hi!</h1>
  </tg-ui-modal>
  `,
  args: {
    open: false,
  },
});
