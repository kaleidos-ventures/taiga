/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { BadgeComponent } from './badge.component';
import { UiModule } from '../ui.module';

describe('BadgeComponent', () => {
  let spectator: Spectator<BadgeComponent>;
  const createComponent = createComponentFactory({
    component: BadgeComponent,
    imports: [ UiModule ],
    declareComponent: false,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        label: 'example'
      },
      providers: [],
      detectChanges: false
    });
  });

  it('label should be visible', () => {
    spectator.detectChanges();
    expect(spectator.query('span')).toHaveExactText(spectator.component.label);
  });
});
