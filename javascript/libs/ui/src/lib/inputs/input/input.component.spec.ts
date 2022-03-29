/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import '@ng-web-apis/universal/mocks';
import { createHostFactory } from '@ngneat/spectator/jest';
import { InputComponent } from './input.component';
import { InputsModule } from '../inputs.module';
import {
  ControlContainer,
  FormControl,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { SpectatorHost } from '@ngneat/spectator';
import { FormDirective } from '../form/form.directive';

describe('InputComponent', () => {
  let spectator: SpectatorHost<InputComponent>;
  const fgd = new FormGroupDirective([], []);

  const createHost = createHostFactory({
    component: InputComponent,
    imports: [InputsModule],
    providers: [{ provide: ControlContainer, useValue: fgd }],
    mocks: [FormDirective],
  });

  beforeEach(() => {
    spectator = createHost(
      `
    <tg-ui-input
      [icon]="icon"
      [label]="label"
      [accessibleLabel]='accessibleLabel'>
      <input
        [formControl]="control"
        inputRef>
    </tg-ui-input>
    `,
      {
        hostProps: {
          control: new FormControl('', [Validators.required]),
          icon: 'example',
          label: 'example',
          accessibleLabel: 'example',
        },
        detectChanges: false,
      }
    );
  });

  it('svg should be visible', () => {
    spectator.detectChanges();
    expect(spectator.query('tui-svg')).toExist();
  });

  it('fill id', () => {
    spectator.detectChanges();
    expect(spectator.query('input')).toHaveAttribute(
      'id',
      spectator.component.id
    );
    expect(spectator.query('label')).toHaveAttribute(
      'for',
      spectator.component.id
    );
  });

  it('label should be visible', () => {
    spectator.detectChanges();
    expect(spectator.query('label.input-label')).toHaveExactText(
      `${spectator.component.label} ${spectator.component.accessibleLabel}`
    );
  });

  it('aria required & invalid', () => {
    spectator.detectChanges();
    expect(spectator.query('input')).toHaveAttribute('aria-required', 'true');
    expect(spectator.query('input')).toHaveAttribute('aria-invalid', 'true');
  });
});
