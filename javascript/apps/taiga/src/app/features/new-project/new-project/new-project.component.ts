/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { fetchWorkspaceList } from '~/app/features/workspace/actions/workspace.actions';
import { selectWorkspaces } from '~/app/features/workspace/selectors/workspace.selectors';

@Component({
  selector: 'tg-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectComponent implements OnInit {

  public workspaceList$ = this.store.select(selectWorkspaces);

  public createProjectForm!: FormGroup;

  constructor(
    private store: Store,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  public ngOnInit() {
    this.store.dispatch(fetchWorkspaceList());
  }

  public initForm() {
    this.createProjectForm = this.fb.group({
      workspace: ['']
    });
  }

}
