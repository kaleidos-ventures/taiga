/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  Validators,
  AbstractControlOptions,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { TuiRootModule } from '@taiga-ui/core';
import { InputsModule } from '../inputs.module';
import { TextareaComponent } from './textarea.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'tg-ui-forms',
  template: `
    <tui-root>
      <div style="width: 500px">
        <form [formGroup]="form" (submit)="submit()">
          <tg-ui-textarea [label]="label" [optional]="optional">
            <tui-text-area
              formControlName="example"
              [readOnly]="readOnly"
              [expandable]="true"
              [tuiTextfieldMaxLength]="140">
              {{ placeholder }}
            </tui-text-area>
            <tg-ui-error error="required"> Field mandatory </tg-ui-error>
            <tg-ui-error inputError error="maxlength">
              Maximun length 140
            </tg-ui-error>
          </tg-ui-textarea>
          <button type="submit">Submit</button>
        </form>
      </div>
    </tui-root>
  `,
  styleUrls: [],
})
class FormsComponent implements OnChanges {
  @Input()
  public label!: TextareaComponent['label'];

  @Input()
  public placeholder!: string;

  @Input()
  public disabled = false;

  @Input()
  public optional!: boolean;

  @Input()
  public updateOn: AbstractControlOptions['updateOn'] = 'submit';

  @Input()
  public readOnly!: boolean;

  public form!: FormGroup;
  public items = ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'];

  constructor(private fb: FormBuilder) {}

  public initForm() {
    const validators = [Validators.maxLength(140)];

    if (!this.optional) {
      validators.push(Validators.required);
    }

    this.form = this.fb.group(
      {
        example: ['', validators],
      },
      { updateOn: this.updateOn }
    );

    if (this.disabled) {
      this.form.get('example')?.disable();
    } else {
      this.form.get('example')?.enable();
    }
  }

  public submit() {
    console.log('submit');
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.optional || changes.updateOn || changes.disabled) {
      this.initForm();
    }
  }
}

export default ConfigureStory({
  title: 'Textarea',
  component: TextareaComponent,
  extraModules: [TuiRootModule, BrowserAnimationsModule, InputsModule],

  declarations: [FormsComponent],
});

const baseArgs = {
  label: 'label',
  placeholder: 'placeholder',
};

const baseArgTypes = {
  disabled: {
    defaultValue: null,
    options: [null, true],
    control: { type: 'radio' },
  },
  readOnly: {
    defaultValue: null,
    options: [null, true],
    control: { type: 'radio' },
  },
  optional: {
    defaultValue: null,
    options: [null, true],
    control: { type: 'radio' },
  },
  updateOn: {
    defaultValue: 'submit',
    options: ['blur', 'change', 'submit'],
    control: { type: 'radio' },
  },
};

export const UITextarea = ConfigureTemplate({
  template: `
    <tg-ui-forms
      [label]="label"
      [placeholder]="placeholder"
      [updateOn]="updateOn"
      [optional]="optional"
      [disabled]="disabled"
      [readOnly]="readOnly">
    </tg-ui-forms>
  `,
  args: baseArgs,
  argTypes: baseArgTypes,
});
