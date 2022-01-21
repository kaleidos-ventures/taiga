/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input } from '@angular/core';
import { Validators, AbstractControlOptions, FormGroup, FormBuilder } from '@angular/forms';
import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { TuiRootModule } from '@taiga-ui/core';
import { InputsModule } from '../inputs.module';
import { SelectComponent } from './select.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'tg-ui-forms',
  template: `
  <tui-root>
    <div style="width: 500px">
      <form
        [formGroup]="form"
        (submit)="submit()">
        <tg-ui-select [label]="label">
          <tui-select
            tuiTextfieldSize="l"
            formControlName="example">
            <tui-data-list-wrapper
              *tuiDataList
              [items]="items"
            ></tui-data-list-wrapper>
          </tui-select>
          <tg-ui-error
            inputError
            error="required">
            Field mandatory
          </tg-ui-error>
        </tg-ui-select>
        <button type="submit">Submit</button>
      </form>
    </div>
  </tui-root>
  `,
  styleUrls: [],
})
class FormsComponent {
  @Input()
  public label!: SelectComponent['label'];

  @Input()
  public placeholder!: string;

  @Input()
  public set disabled(disabled: boolean) {
    if (disabled) {
      this.form.get('example')?.disable();
    } else {
      this.form.get('example')?.enable();
    }
  };

  @Input()
  public set updateOn(updateOn: AbstractControlOptions['updateOn']) {
    this.initForm(updateOn);
  }

  @Input()
  public readOnly!: boolean;

  public form!: FormGroup;
  public items = [
    'Test 1',
    'Test 2',
    'Test 3',
    'Test 4',
    'Test 5',
  ];

  constructor(private fb: FormBuilder) {}

  public initForm(updateOn: AbstractControlOptions['updateOn'] = 'submit') {
    this.form = this.fb.group({
      example: ['', [Validators.required]],
    }, { updateOn });
  }

  public submit() {
    console.log('submit');
  }
}

export default ConfigureStory({
  title: 'Selects',
  component: SelectComponent,
  extraModules: [
    TuiRootModule,
    BrowserAnimationsModule,
    InputsModule,
  ],

  declarations: [ FormsComponent ],
});

const baseArgs = {
  label: 'label',
  placeholder: 'placeholder',
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
  updateOn: {
    defaultValue: 'submit',
    options: ['blur', 'change', 'submit'],
    control: { type: 'radio' }
  },
};

export const UISelect = ConfigureTemplate({
  template: `
    <tg-ui-forms
      [label]="label"
      [placeholder]="placeholder"
      [updateOn]="updateOn"
      [disabled]="disabled"
      [readOnly]="readOnly">
    </tg-ui-forms>
  `,
  args: baseArgs,
  argTypes: baseArgTypes,
});
