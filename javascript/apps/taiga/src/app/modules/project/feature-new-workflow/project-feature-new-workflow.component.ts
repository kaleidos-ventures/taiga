/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Workflow } from '@taiga/data';
import { filterNil } from '~/app/shared/utils/operators';
import { selectCurrentProject } from '../data-access/+state/selectors/project.selectors';
import { KanbanActions } from '../feature-kanban/data-access/+state/actions/kanban.actions';
import { NewWorkflowFormComponent } from './components/new-workflow-form/new-workflow-form.component';

@Component({
  selector: 'tg-project-feature-new-workflow',
  templateUrl: './project-feature-new-workflow.component.html',
  styleUrls: ['./project-feature-new-workflow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NewWorkflowFormComponent],
})
export class ProjectFeatureNewWorkflowComponent {
  constructor(
    private state: RxState<{
      project: Project;
    }>,
    private store: Store,
    private router: Router
  ) {
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
  }

  public createWorkflow(workflow: Workflow['name']) {
    this.store.dispatch(
      KanbanActions.createWorkflow({
        name: workflow,
      })
    );
  }

  public cancelCreateWorkflow() {
    const project = this.state.get('project');
    const firstworkflow = project.workflows[0];
    void this.router.navigate([
      '/project',
      project.id,
      project.slug,
      'kanban',
      firstworkflow.slug,
    ]);
  }
}
