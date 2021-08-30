/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { InputComponent } from './input.component';
import { InputsModule } from './../inputs.module';

describe('InputComponent', () => {
  let spectator: Spectator<InputComponent>;
  const createComponent = createComponentFactory({
    component: InputComponent,
    imports: [ InputsModule ],
    declareComponent: false,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        icon: 'example',
        label: 'example'
      },
      providers: [],
      detectChanges: false
    });
  });

  it('label should be visible', () => {
    spectator.detectChanges();
    expect(spectator.query('label.input-label')).toHaveExactText(spectator.component.label);
  });
});
