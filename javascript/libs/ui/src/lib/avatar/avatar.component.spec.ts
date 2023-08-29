/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { AvatarComponent } from './avatar.component';
import { RandomColorService } from '../services/random-color/random-color.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AvatarComponent', () => {
  let spectator: Spectator<AvatarComponent>;
  const createComponent = createComponentFactory({
    component: AvatarComponent,
    mocks: [RandomColorService],
    providers: [],
    schemas: [NO_ERRORS_SCHEMA],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
      props: {},
      providers: [],
    });
  });

  it('setAvatarName: input Norma Fisher -> ouput N M', () => {
    expect(spectator.component.setAvatarName('Norma Fisher')).toEqual('N F');
  });

  it('setAvatarName: input / Norma Fisher -> ouput / N', () => {
    expect(spectator.component.setAvatarName('/ Norma Fisher')).toEqual('/ N');
  });

  it('setAvatarName: input Norma ? Fisher -> ouput N ?', () => {
    expect(spectator.component.setAvatarName('Norma ? Fisher')).toEqual('N ?');
  });

  it('setAvatarName: input Norma 🤖 Fisher -> ouput N', () => {
    expect(spectator.component.setAvatarName('Norma 🤖 Fisher')).toEqual('N');
  });
});
