/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { FormControl } from '@angular/forms';
import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { ImageUploadComponent } from './image-upload.component';
import { ImageUploadModule } from './image-upload.module';

export default ConfigureStory({
  title: 'Image Upload',
  component: ImageUploadComponent,
  extraModules: [ ImageUploadModule ],
});

export const ImageUpload = ConfigureTemplate({
  template: `
  <div class="story-flex">
    <tg-ui-image-upload
      [control]="control"
      title="title"
      label="label"
      tip="Allowed formats: gif, png, jpg, gif, svg and webp"
      accept="image/webp, image/gif, image/jpg, image/jpeg, image/png, image/svg">
    </tg-ui-image-upload>
  </div>
  `,
  props: {
    control: new FormControl(),
  },
  args: {
    title: 'title'
  }
});
