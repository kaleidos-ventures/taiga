/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Workflow } from '@taiga/data';
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
  constructor(private store: Store) {}

  public createWorkflow(workflow: Workflow['name']) {
    console.log({ workflow });
    this.store.dispatch(
      KanbanActions.createWorkflow({
        name: workflow,
      })
    );
  }

  public cancelCreateWorkflow() {
    console.log('routelink to main');
  }
}
