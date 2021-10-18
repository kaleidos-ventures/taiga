/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, Validators, AbstractControlOptions } from '@angular/forms';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { InputsModule } from '../inputs.module';
import { InputComponent } from './input.component';

@Component({
  selector: 'tg-ui-forms',
  template: `
  <div class="story-small-container">
    <form [formGroup]="form" (submit)="submit()" #exampleForm="ngForm">
      <tg-ui-input
        [icon]="iconSvg"
        [label]="label">
        <input
          formControlName="example"
          inputRef
          [attr.readOnly]="readOnly"
          [placeholder]="placeholder">
        <tg-ui-error
          inputError
          error="required">
          Field mandatory
        </tg-ui-error>
      </tg-ui-input>
      <tg-ui-input
        [icon]="iconSvg"
        [label]="label">
        <input
          formControlName="email"
          inputRef
          [attr.readOnly]="readOnly"
          [placeholder]="placeholder">
        <ng-container inputError>
          <tg-ui-error error="required">
            Field mandatory
          </tg-ui-error>
          <tg-ui-error error="email">
            Invalid email
          </tg-ui-error>
        </ng-container>
      </tg-ui-input>
      <button type="submit">Submit</button>
    </form>
  </div>
  `,
  styleUrls: [],
})
class FormsComponent {
  @Input()
  public iconSvg!: InputComponent['icon'];

  @Input()
  public label!: InputComponent['label'];

  @Input()
  public placeholder!: string;

  @Input()
  public set disabled(disabled: boolean) {
    if (disabled) {
      this.form.get('example')?.disable();
      this.form.get('email')?.disable();
    } else {
      this.form.get('example')?.enable();
      this.form.get('email')?.enable();
    }
  };

  @Input()
  public set updateOn(updateOn: AbstractControlOptions['updateOn']) {
    this.initForm(updateOn);
  }

  @Input()
  public readOnly!: boolean;

  public form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  public initForm(updateOn: AbstractControlOptions['updateOn'] = 'submit') {
    this.form = this.fb.group({
      example: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    }, { updateOn });
  }

  public submit() {
    console.log('submit');
  }
}

export default ConfigureStory({
  title: 'Inputs',
  component: InputComponent,
  extraModules: [
    InputsModule,
    ReactiveFormsModule
  ],
  declarations: [ FormsComponent ]
});

const baseArgs = {
  label: 'label',
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

export const UIInput = ConfigureTemplate({
  template: `
    <tg-ui-forms
      [label]="label"
      [placeholder]="placeholder"
      [iconSvg]="iconSvg"
      [updateOn]="updateOn"
      [disabled]="disabled"
      [readOnly]="readOnly">
    </tg-ui-forms>
  `,
  args: baseArgs,
  argTypes: baseArgTypes,
});
