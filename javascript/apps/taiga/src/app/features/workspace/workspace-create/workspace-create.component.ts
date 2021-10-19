/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { RandomColorService } from '~/app/shared/random-color/random-color.service';
import { createFormHasError, createWorkspace } from '../actions/workspace.actions';

@Component({
  selector: 'tg-workspace-create',
  templateUrl: './workspace-create.component.html',
  styleUrls: ['./workspace-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class WorkspaceCreateComponent implements OnInit {

  @Output()
  public requestClose = new EventEmitter<void>();

  @ViewChild('firstInput', { static: false }) public firstInput!: ElementRef;

  constructor(
    private store: Store,
    private fb: FormBuilder,
  ) {}

  // #TODO: Add user ID when we have real users on the app
  public userId = 5;
  public color = 0;
  public createProjectForm!: FormGroup;
  public name = '';

  public close() {
    this.store.dispatch(createFormHasError({ hasError: false }));
    this.requestClose.next();
  }

  public ngOnInit(): void {
    this.color = RandomColorService.randomColorPicker();
    this.createProjectForm = this.fb.group({
      projectName: [
        '',
        [
          Validators.required,
        ]
      ]
    }, { updateOn: 'submit' });
  }

  public setName(event: Event) {
    this.name = (<HTMLInputElement>event.target).value;
  }

  public onSubmit() {
    if (this.createProjectForm.invalid) {
      (this.firstInput.nativeElement as HTMLElement).focus();
      this.store.dispatch(createFormHasError({ hasError: true }));

    } else {
      this.store.dispatch(createWorkspace({
        name: this.createProjectForm.get('projectName')!.value as string,
        color: this.color,
        userId: this.userId
      }));
      this.requestClose.next();
    }
  }
}
