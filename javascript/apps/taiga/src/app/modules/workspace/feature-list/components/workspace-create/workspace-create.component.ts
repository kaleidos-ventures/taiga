/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { RandomColorService } from '@taiga/ui/services/random-color/random-color.service';
import {
  createFormHasError,
  createWorkspace,
} from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { TuiButtonModule } from '@taiga-ui/core';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';
import { InputsModule } from '@taiga/ui/inputs';
import { AvatarComponent } from '@taiga/ui/avatar/avatar.component';
import { FormDirective } from '@taiga/ui/inputs/form/form.directive';
import {
  WorkspaceNameMaxLength,
  WorkspaceNameValidation,
} from '~/app/shared/workspace/workspace-name-validation';

@Component({
  selector: 'tg-workspace-create',
  templateUrl: './workspace-create.component.html',
  styleUrls: ['./workspace-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    InputsModule,
    ReactiveFormsModule,
    FormDirective,
    AvatarComponent,
    TuiAutoFocusModule,
    TuiButtonModule,
    TranslocoPipe,
  ],
})
export class WorkspaceCreateComponent implements OnInit {
  @Output()
  public requestClose = new EventEmitter<void>();

  @ViewChild('firstInput', { static: false }) public firstInput!: ElementRef;

  constructor(private store: Store, private fb: FormBuilder) {}

  public color = 0;
  public createProjectForm!: FormGroup;
  public name = '';
  public maxLength = WorkspaceNameMaxLength;
  public submitted = false;

  public close() {
    this.store.dispatch(createFormHasError({ hasError: false }));
    this.requestClose.next();
  }

  public ngOnInit(): void {
    this.color = RandomColorService.randomColorPicker();
    this.createProjectForm = this.fb.group(
      {
        workspaceName: ['', WorkspaceNameValidation],
      },
      { updateOn: 'submit' }
    );
  }

  public setName(event: Event) {
    this.submitted = false;
    this.name = (<HTMLInputElement>event.target).value;
  }

  public onSubmit() {
    if (this.createProjectForm.invalid) {
      this.submitted = true;
      (this.firstInput.nativeElement as HTMLElement).focus();
      this.store.dispatch(createFormHasError({ hasError: true }));
    } else {
      this.store.dispatch(
        createWorkspace({
          name: this.createProjectForm.get('workspaceName')!.value as string,
          color: this.color,
        })
      );
      this.requestClose.next();
    }
  }
}
