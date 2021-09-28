/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';

interface ComponentViewModel {
  todo: string;
}

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

  public createProjectForm!: FormGroup;
  public createProjectFormInvalid = false;
  public createProjectErrorList: unknown[] = [];

  public readonly todo$ = this.state.select('todo');
  public readonly model$ = this.state.select();

  constructor(
    private store: Store,
    private state: RxState<ComponentViewModel>,
    private fb: FormBuilder
  ) {
    // initial state
    // this.state.set({});

    // connect the ngrx state with the local state
    // this.state.connect('todo', this.store.select(selectTodo));
  }

  public close() {
    this.requestClose.next();
  }

  public ngOnInit(): void {
    this.createProjectForm = this.fb.group({
      projectName: [
        '',
        [
          Validators.required,
          Validators.pattern(`^[a-zA-Z0-9 \-]+$`) //eslint-disable-line
        ]
      ]
    });
  }

  public getFormValidationErrors(form: FormGroup) {
    const result: unknown[] = [];
    Object.keys(form.controls).forEach(key => {
      const controlErrors: ValidationErrors | null = form.get(key)!.errors;
      if (controlErrors) {
        Object.keys(controlErrors).forEach(keyError => {
          result.push(keyError);
        });
      }
    });
    return result;
  }

  public onSubmit() {
    if (this.createProjectForm.invalid) {
      this.createProjectFormInvalid = true;
      this.createProjectErrorList = this.getFormValidationErrors(this.createProjectForm);
      (this.firstInput.nativeElement as HTMLElement).focus();
    } else {
      this.createProjectFormInvalid = false;
      if (this.createProjectForm.valid ) {
        // #TODO: Submit to back here if ok next line
        this.requestClose.next();
      }
    }
  }
}
