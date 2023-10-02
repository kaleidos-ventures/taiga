/**.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoDirective } from '@ngneat/transloco';
import { TooltipDirective } from '@taiga/ui/tooltip';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiHostedDropdownModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Project, Workflow } from '@taiga/data';
import { BreadcrumbComponent } from '@taiga/ui/breadcrumb/breadcrumb.component';
import { DeleteWorkflowComponent } from '../delete-workflow/delete-workflow.component';
import { NewWorkflowFormComponent } from '~/app/modules/project/feature-new-workflow/components/new-workflow-form/new-workflow-form.component';
import {
  deleteWorkflow,
  updateWorkflow,
} from '~/app/modules/project/data-access/+state/actions/project.actions';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tg-kanban-header',
  templateUrl: './kanban-header.component.html',
  styleUrls: ['./kanban-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TooltipDirective,
    TuiHostedDropdownModule,
    TuiButtonModule,
    TuiDataListModule,
    TuiSvgModule,
    DeleteWorkflowComponent,
    BreadcrumbComponent,
    NewWorkflowFormComponent,
  ],
})
export class KanbanHeaderComponent {
  @Input({ required: true }) public project!: Project;
  @Input({ required: true }) public workflows: Workflow[] = [];
  @Input({ required: true }) public workflow!: Workflow;

  public openWorkflowOptions = false;
  public deleteWorkflowModal = false;
  public editStatusFormOpened = false;

  constructor(private store: Store) {}

  public openDeleteWorkflowModal() {
    this.deleteWorkflowModal = true;
  }

  public submitDeleteWorkflow(event: Workflow['id'] | undefined) {
    this.store.dispatch(
      deleteWorkflow({ workflow: this.workflow, moveTo: event })
    );
  }

  public toggleEditWorkflowForm() {
    this.openWorkflowOptions = false;
    this.editStatusFormOpened = !this.editStatusFormOpened;
  }

  public editWorkflowName(workflow: Workflow['name']) {
    this.toggleEditWorkflowForm();
    this.store.dispatch(
      updateWorkflow({
        name: workflow,
        slug: this.workflow.slug,
      })
    );
  }
}
