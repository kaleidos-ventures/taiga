/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { FormControl, FormGroup } from '@angular/forms';
import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { InputsModule } from '../inputs.module';
import { ImageUploadModule } from './image-upload.module';
import { Component } from '@angular/core';

@Component({
  selector: 'tg-ui-image-upload-story',
  template: `
    <div class="story-flex">
      <form [formGroup]="form">
        <tg-ui-image-upload
          [control]="control"
          title="title"
          label="label"
          [tip]="t('common_project.forms.choose_image_tip')"
          accept="image/webp, image/gif, image/jpg, image/jpeg, image/png, image/svg">
        </tg-ui-image-upload>
      </form>
    </div>
  `,
})
class ImageUploadStoryComponent {
  public control = new FormControl();
  public form = new FormGroup({});
}

const story = ConfigureStory({
  component: ImageUploadStoryComponent,
  extraModules: [ImageUploadModule, InputsModule],
});

export default {
  ...story,
  title: 'Image Upload',
};

export const ImageUpload = ConfigureTemplate({
  args: {},
});
