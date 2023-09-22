/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Workflow } from '@taiga/data';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { filterNil } from '~/app/shared/utils/operators';
import {
  createWorkflow,
  projectApiActions,
} from '../data-access/+state/actions/project.actions';
import { selectCurrentProject } from '../data-access/+state/selectors/project.selectors';
import { NewWorkflowFormComponent } from './components/new-workflow-form/new-workflow-form.component';
import { NewWorkflowSkeletonComponent } from './components/new-workflow-skeleton/new-workflow-skeleton.component';
@UntilDestroy()
@Component({
  selector: 'tg-project-feature-new-workflow',
  templateUrl: './project-feature-new-workflow.component.html',
  styleUrls: ['./project-feature-new-workflow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NewWorkflowFormComponent, NewWorkflowSkeletonComponent],
})
export class ProjectFeatureNewWorkflowComponent {
  constructor(
    private state: RxState<{
      project: Project;
    }>,
    private store: Store,
    private router: Router,
    private actions$: Actions,
    private routeHistoryService: RouteHistoryService
  ) {
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.actions$
      .pipe(ofType(projectApiActions.createWorkflowError), untilDestroyed(this))
      .subscribe(() => {
        this.cancelCreateWorkflow();
      });
  }

  public createWorkflow(workflow: Workflow['name']) {
    this.store.dispatch(
      createWorkflow({
        name: workflow,
      })
    );
  }

  public cancelCreateWorkflow() {
    void this.router.navigate(this.getPreviousUrl);
  }

  public get getPreviousUrl(): string[] {
    const previousUrl = this.routeHistoryService.getPreviousUrl();
    const project = this.state.get('project');
    console.log({ previousUrl });
    return previousUrl
      ? [previousUrl]
      : [`/project/${project.id}${project.slug}/overview`];
  }
}
