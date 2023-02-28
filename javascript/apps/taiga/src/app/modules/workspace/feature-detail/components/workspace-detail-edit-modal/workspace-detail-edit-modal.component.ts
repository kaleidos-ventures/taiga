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
  HostListener,
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
  selector: 'tg-workspace-detail-edit-modal',
  templateUrl: './workspace-detail-edit-modal.component.html',
  styleUrls: ['./workspace-detail-edit-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceDetailEditModalComponent implements OnInit {
  @Input()
  public workspace!: Workspace;

  @Input()
  public open = false;

  @Output()
  public update = new EventEmitter();

  @Output()
  public cancelEdit = new EventEmitter();

  @HostListener('window:beforeunload')
  public unloadHandler() {
    if (this.nameForm.dirty) {
      return false;
    }
    return true;
  }

  public maxLength = WorkspaceNameMaxLength;
  public showConfirmEditProjectModal = false;

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
    if (this.nameForm.valid) {
      this.update.emit(this.nameForm.value);
    }
  }

  public cancel() {
    if (this.nameForm.dirty) {
      this.showConfirmEditProjectModal = true;
    } else {
      this.cancelEdit.emit();
    }
  }

  public discardChanges() {
    this.showConfirmEditProjectModal = false;
    this.cancelEdit.emit();
  }

  public keepEditing() {
    this.showConfirmEditProjectModal = false;
  }
}
