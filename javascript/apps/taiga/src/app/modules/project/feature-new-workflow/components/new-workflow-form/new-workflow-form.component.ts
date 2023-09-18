/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';
import { Workflow } from '@taiga/data';
import { InputsModule } from '@taiga/ui/inputs';

@Component({
  selector: 'tg-new-workflow-form',
  templateUrl: './new-workflow-form.component.html',
  styleUrls: ['./new-workflow-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    ReactiveFormsModule,
    InputsModule,
    TuiButtonModule,
  ],
})
export class NewWorkflowFormComponent implements OnInit {
  @Output()
  public createWorkflow = new EventEmitter<Workflow['name']>();

  @Output()
  public cancelCreateWorkflow = new EventEmitter();

  public newWorkflowForm!: FormGroup;

  public workflowNameMaxLength = 40;
  public submitted = false;

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.initForm();
  }

  public initForm() {
    this.newWorkflowForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.workflowNameMaxLength),
          //avoid only white spaces
          Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/),
        ],
      ],
    });
  }

  public submitCreateWorkflow() {
    this.submitted = true;
    const workflowName = this.newWorkflowForm.get('name')
      ?.value as Workflow['name'];
    this.createWorkflow.emit(workflowName);
  }

  public cancelEdit() {
    this.cancelCreateWorkflow.emit();
  }
}
