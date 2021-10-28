/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ProjectCreation } from '@taiga/data';
import { fetchWorkspaceList } from '~/app/features/workspace/actions/workspace.actions';
import { selectWorkspaces } from '~/app/features/workspace/selectors/workspace.selectors';
import { Step } from '~/app/features/project/new-project/data/new-project.model';

@Component({
  selector: 'tg-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectComponent implements OnInit {
  public workspaceList$ = this.store.select(selectWorkspaces);
  public currentStep: Step = 'template';

  public formData: ProjectCreation = {
    workspaceSlug: '',
    title: '',
    description: 'string',
    color: 0,
  };

  constructor(
    private store: Store,
  ) {}

  public ngOnInit() {
    this.store.dispatch(fetchWorkspaceList());
  }
  
  public onSelectTemplate(workspaceSlug: ProjectCreation['workspaceSlug']) {
    this.formData.workspaceSlug = workspaceSlug;
    this.currentStep = 'detail';
  }
}
