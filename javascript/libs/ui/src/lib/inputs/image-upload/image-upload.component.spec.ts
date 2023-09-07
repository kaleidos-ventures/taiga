/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { ImageUploadComponent } from './image-upload.component';
import { randSentence, randNumber, randWord } from '@ngneat/falso';
import { getTranslocoModule } from '@taiga/ui/transloco/transloco-testing.module';
import {
  ControlContainer,
  FormControl,
  FormGroupDirective,
} from '@angular/forms';
import { ErrorComponent } from '../error/error.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AvatarComponent } from '@taiga/ui/avatar/avatar.component';
import { TuiButtonComponent } from '@taiga-ui/core';

describe('ImageUploadComponent', () => {
  let spectator: Spectator<ImageUploadComponent>;
  const fgd = new FormGroupDirective([], []);
  const createComponent = createComponentFactory({
    component: ImageUploadComponent,
    imports: [getTranslocoModule()],
    overrideComponents: [
      [
        ImageUploadComponent,
        {
          remove: {
            imports: [ErrorComponent, AvatarComponent, TuiButtonComponent],
          },
          add: {
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
          },
        },
      ],
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        label: randWord({ length: 5 }).join(' '),
        tip: randSentence(),
        title: randSentence(),
        color: randNumber(),
      },
      providers: [{ provide: ControlContainer, useValue: fgd }],
      detectChanges: false,
    });
  });

  it('remove FilePath', () => {
    spectator.component.control = new FormControl(randWord());
    spectator.detectChanges();
    spectator.component.removeImage();
    expect(spectator.component.control.value).toBe('');
    expect(spectator.component.safeImageUrl).toBe('');
  });
});
