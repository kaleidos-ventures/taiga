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
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiHostedDropdownModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Project, Workflow } from '@taiga/data';
import { BreadcrumbComponent } from '@taiga/ui/breadcrumb/breadcrumb.component';
import { DeleteWorkflowComponent } from '../delete-workflow/delete-workflow.component';

@Component({
  selector: 'tg-kanban-header',
  templateUrl: './kanban-header.component.html',
  styleUrls: ['./kanban-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TuiHostedDropdownModule,
    TuiButtonModule,
    TuiDataListModule,
    TuiSvgModule,
    DeleteWorkflowComponent,
    BreadcrumbComponent,
  ],
})
export class KanbanHeaderComponent {
  @Input({ required: true }) public project!: Project;
  @Input({ required: true }) public workflows: Workflow[] = [];
  @Input({ required: true }) public workflow!: Workflow;

  public openWorkflowOptions = false;
  public deleteWorkflowModal = false;

  public openDeleteWorkflowModal() {
    this.deleteWorkflowModal = true;
  }

  public submitDeleteWorkflow(event: Workflow['id'] | undefined) {
    console.log(event);
  }
}
