/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { FileUploadComponent } from './file-upload.component';

export default ConfigureStory({
  title: 'File Upload',
  component: FileUploadComponent,
});

// const baseArgs = {
//   label: 'label',
// };

export const Badge = ConfigureTemplate({
  template: `
  <div class="story-small-container">
    <tg-file-upload></tg-ui-badge>
  </div>
  `,
  // args: baseArgs,
});
