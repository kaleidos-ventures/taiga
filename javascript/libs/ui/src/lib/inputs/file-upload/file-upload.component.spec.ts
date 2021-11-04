/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { FileUploadComponent } from './file-upload.component';

import * as faker from 'faker'; 

describe('FileUploadComponent', () => {
  let spectator: Spectator<FileUploadComponent>;
  const createComponent = createComponentFactory({
    component: FileUploadComponent,
    declareComponent: false,
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
    spectator.component.filePath = faker.datatype.string();
    spectator.component.removeImage();
    expect(spectator.component.filePath).toBe('');
  });
});
