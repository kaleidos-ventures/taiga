/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'tg-ui-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['../inputs.css', './radio.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
})
export class RadioComponent {
  @Input({ required: true })
  public label = '';

  @Input({ required: true })
  public name = '';

  @Input({ required: true })
  public value = '';

  @Input({ required: true })
  public id = '';

  @Input({ required: true })
  public control!: FormControl;
}
