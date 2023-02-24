/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';
import { AvatarModule } from '@taiga/ui/avatar';
import { UiErrorModule } from '../error/error.module';
import { ImageUploadComponent } from './image-upload.component';

@NgModule({
  imports: [
    CommonModule,
    TranslocoModule,
    AvatarModule,
    TuiButtonModule,
    UiErrorModule,
  ],
  declarations: [ImageUploadComponent],
  exports: [ImageUploadComponent],
})
export class ImageUploadModule {}
