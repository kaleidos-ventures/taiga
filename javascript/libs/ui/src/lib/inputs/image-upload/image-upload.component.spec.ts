/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import '@ng-web-apis/universal/mocks';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { ImageUploadComponent } from './image-upload.component';
import { FormControl } from '@ngneat/reactive-forms';
import * as faker from 'faker';
import { getTranslocoModule } from '@taiga/ui/transloco/transloco-testing.module';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ImageUploadComponent', () => {
  let spectator: Spectator<ImageUploadComponent>;
  const fgd = new FormGroupDirective([], []);
  const createComponent = createComponentFactory({
    component: ImageUploadComponent,
    imports: [
      getTranslocoModule(),
    ],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      { provide: ControlContainer, useValue: fgd },
    ]
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        label: faker.lorem.words(5),
        tip: faker.lorem.sentence(),
        title: faker.lorem.sentence(),
        color: faker.datatype.number(),
      },
      providers: [],
      detectChanges: false
    });
  });

  it('remove FilePath', () => {
    spectator.component.control = new FormControl(faker.datatype.string());
    spectator.detectChanges();
    spectator.component.removeImage();
    expect(spectator.component.control.value).toBe('');
    expect(spectator.component.safeImageUrl).toBe('');
  });
});
