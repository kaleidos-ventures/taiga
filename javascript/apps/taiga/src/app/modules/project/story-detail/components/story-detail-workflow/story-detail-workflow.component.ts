/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiHostedDropdownComponent,
  TuiHostedDropdownModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { StoryDetail, Workflow } from '@taiga/data';
import { BreadcrumbComponent } from '@taiga/ui/breadcrumb/breadcrumb.component';

@Component({
  selector: 'tg-story-detail-workflow',
  templateUrl: './story-detail-workflow.component.html',
  styleUrls: ['./story-detail-workflow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    BreadcrumbComponent,
    TuiButtonModule,
    TuiHostedDropdownModule,
    TuiDataListModule,
    TuiSvgModule,
  ],
})
export class StoryDetailWorkflowComponent implements OnChanges {
  @Input({ required: true })
  public story!: StoryDetail;

  @Input({ required: true })
  public workflows!: Workflow[];

  @Input()
  public canEdit = false;

  @ViewChild(TuiHostedDropdownComponent)
  public component?: TuiHostedDropdownComponent;

  @Output()
  public toWorkflow = new EventEmitter<Workflow>();

  public openWorkflowList = false;
  public filteredWorkflows: Workflow[] = [];

  public ngOnChanges(): void {
    this.filteredWorkflows = this.workflows.filter(
      (workflow) => workflow.slug !== this.story.workflow.slug
    );
  }

  public trackByWorkflowId(_index: number, workflow: Workflow) {
    return workflow.id;
  }

  public moveToWorkflow(workflow: Workflow) {
    this.openWorkflowList = false;
    this.component?.nativeFocusableElement?.focus();
    this.toWorkflow.emit(workflow);
  }
}
