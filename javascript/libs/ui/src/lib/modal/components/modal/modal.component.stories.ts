/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ModalComponent } from './modal.component';
import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { TuiRootModule } from '@taiga-ui/core';
import { ModalModule } from '@taiga/ui/modal/modal.module';
import { PROMPT_PROVIDER } from '@taiga/ui/modal/services/modal.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export default ConfigureStory({
  title: 'ModalComponent',
  component: ModalComponent,
  extraModules: [TuiRootModule, BrowserAnimationsModule, ModalModule],
  extraProviders: [PROMPT_PROVIDER],
});

export const Primary = ConfigureTemplate({
  template: `
  <tui-root>
    <button (click)="open = !open">Open modal</button>
    <tg-ui-modal
      [open]="open"
      (requestClose)="open = !open">
      <h1>Hi!</h1>
    </tg-ui-modal>
  </tui-root>
  `,
  args: {
    open: false,
  },
});
