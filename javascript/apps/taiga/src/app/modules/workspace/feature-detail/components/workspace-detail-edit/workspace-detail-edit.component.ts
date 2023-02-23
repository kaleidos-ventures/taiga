/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Workspace } from '@taiga/data';
import {
  WorkspaceNameMaxLength,
  WorkspaceNameValidation,
} from '~/app/shared/workspace/workspace-name-validation';

@UntilDestroy()
@Component({
  selector: 'tg-workspace-detail-edit',
  templateUrl: './workspace-detail-edit.component.html',
  styleUrls: ['./workspace-detail-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceDetailEditComponent implements OnInit {
  @Input()
  public workspace!: Workspace;

  @Output()
  public update = new EventEmitter();

  @Output()
  public cancelEdit = new EventEmitter();

  public maxLength = WorkspaceNameMaxLength;

  public nameForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: WorkspaceNameValidation,
    }),
  });

  public ngOnInit() {
    this.nameForm.get('name')?.setValue(this.workspace.name);
  }

  public submit() {
    console.log('submit');
    this.update.emit(this.nameForm.value);
  }

  public cancel() {
    this.cancelEdit.emit();
  }
}
