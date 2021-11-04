/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ProjectCreation, User } from '@taiga/data';
import { fetchWorkspaceList } from '~/app/features/workspace/actions/workspace.actions';
import { createProject } from '~/app/features/project/new-project/actions/new-project.actions';
import { selectWorkspaces } from '~/app/features/workspace/selectors/workspace.selectors';
import { Step } from '~/app/features/project/new-project/data/new-project.model';
import { Router } from '@angular/router';

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
    name: '',
    description: 'string',
    color: 0,
  };

  constructor(
    private store: Store,
    private router: Router
  ) {}

  public ngOnInit() {
    this.store.dispatch(fetchWorkspaceList());
  }

  public onSelectTemplate(workspaceSlug: ProjectCreation['workspaceSlug']) {
    this.formData.workspaceSlug = workspaceSlug;
    this.setStep('detail');
  }

  public createProject(project: ProjectCreation) {
    this.store.dispatch(createProject({ project }));
    this.setStep('invite');
  }

  public setStep(step: Step) {
    this.currentStep = step;
  }

  public onInvite(users: Partial<User>[]) {
    const slug = 'realSlugHere'; // Replace this with real slug in the future;
    if (users.length) {
      console.log('This user will be added', users);
    }
    void this.router.navigate(['/project/', slug, 'kanban' ]);
  }
}
