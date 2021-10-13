/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { TuiSvgModule } from '@taiga-ui/core';
import { SelectComponent } from './select.component';

export default ConfigureStory({
  title: 'Select',
  component: SelectComponent,
  extraModules: [ TuiSvgModule ],
});

const baseArgs = {
  label: 'label',
  error: '',
  placeholder: 'placeholder',
  option1: 'placeholder',
  option2: 'placeholder',
  option3: 'placeholder',
};

const baseArgTypes = {
  disabled: {
    defaultValue: null,
    options: [null, true],
    control: { type: 'radio' }
  },
  readOnly: {
    defaultValue: null,
    options: [null, true],
    control: { type: 'radio' }
  },
};

export const Select = ConfigureTemplate({
  template: `
  <div class="story-small-container">
    <tg-ui-select [icon]="iconSvg" [class.disabled]="disabled" [class.error]="error" [label]="label">
      <select [attr.disabled]="disabled" [attr.readOnly]="readOnly" [placeholder]="placeholder">
        <option>{{option1}}</option>
        <option>{{option2}}</option>
        <option>{{option3}}</option>
      </select>
      <label inputError class="label-error">{{error}}</label>
    </tg-ui-select>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes,
});
