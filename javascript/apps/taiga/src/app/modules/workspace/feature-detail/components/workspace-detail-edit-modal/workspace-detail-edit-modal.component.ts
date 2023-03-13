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
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Workspace } from '@taiga/data';
import { tap } from 'rxjs';
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

  @Output()
  public update = new EventEmitter();

  @Output()
  public cancelEdit = new EventEmitter();

  @Input()
  public set open(open: boolean) {
    this.showEditWorkspaceModal = open;

    if (open) {
      this.showConfirmEditWorkspaceModal = false;
    }
  }

  @HostListener('window:beforeunload')
  public unloadHandler() {
    this.nameForm.updateValueAndValidity();
    if (this.nameForm.dirty) {
      return false;
    }
    return true;
  }

  public maxLength = WorkspaceNameMaxLength;
  public showConfirmEditWorkspaceModal = false;
  public showEditWorkspaceModal = false;

  public nameForm = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: WorkspaceNameValidation,
      }),
    },
    { updateOn: 'submit' }
  );

  public ngOnInit() {
    this.nameForm.get('name')?.setValue(this.workspace.name);

    this.nameForm.valueChanges
      .pipe(
        untilDestroyed(this),
        tap(() => this.nameForm.markAsDirty())
      )
      .subscribe();
  }

  public submit() {
    this.nameForm.updateValueAndValidity();
    if (this.nameForm.valid) {
      this.update.emit(this.nameForm.value);
    }
  }

  public cancel() {
    this.nameForm.updateValueAndValidity();
    if (this.nameForm.dirty) {
      this.showConfirmEditWorkspaceModal = true;
      this.showEditWorkspaceModal = false;
    } else {
      this.cancelEdit.emit();
    }
  }

  public discardChanges() {
    this.showConfirmEditWorkspaceModal = false;
    this.cancelEdit.emit();
  }

  public keepEditing() {
    this.showConfirmEditWorkspaceModal = false;
    this.showEditWorkspaceModal = true;
  }
}
