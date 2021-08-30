/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { TuiSvgModule } from '@taiga-ui/core';
import { InputComponent } from './input.component';

export default ConfigureStory({
  title: 'Inputs',
  component: InputComponent,
  extraModules: [ TuiSvgModule ],
});


const baseArgs = {
  label: 'label',
  error: '',
  placeholder: 'placeholder',

};

const baseArgTypes = {
  iconSvg: {
    defaultValue: '',
    options: ['','folder', 'help', 'discover', 'bell', 'taiga-logo'],
    control: { type: 'select' }
  },
  disabled: {
    defaultValue: null,
    options: [null, true],
    control: { type: 'radio'}
  },
  readOnly: {
    defaultValue: null,
    options: [null, true],
    control: { type: 'radio'}
  },
};

export const Input = ConfigureTemplate({
  template: `
  <div class="story-small-container">
    <tg-ui-input [icon]="iconSvg" [class.disabled]="disabled" [class.error]="error" [label]="label">
      <input [attr.disabled]="disabled" [attr.readOnly]="readOnly" [placeholder]="placeholder">
      <label inputError class="label-error">{{error}}</label>
    </tg-ui-input>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes,
});
