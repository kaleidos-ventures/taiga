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
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiHostedDropdownComponent,
  TuiHostedDropdownModule,
  TuiNotification,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Project, StoryDetail, Workflow } from '@taiga/data';
import { BreadcrumbComponent } from '@taiga/ui/breadcrumb/breadcrumb.component';
import { AppService } from '~/app/services/app.service';
import { WsService } from '~/app/services/ws';

@UntilDestroy()
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
export class StoryDetailWorkflowComponent implements OnInit, OnChanges {
  @Input({ required: true })
  public story!: StoryDetail;

  @Input({ required: true })
  public project!: Project;

  @Input()
  public canEdit = false;

  @ViewChild(TuiHostedDropdownComponent)
  public component?: TuiHostedDropdownComponent;

  @Output()
  public toWorkflow = new EventEmitter<Workflow>();

  public openWorkflowList = false;
  public filteredWorkflows: Workflow[] = [];

  constructor(private wsService: WsService, private appService: AppService) {}

  public ngOnInit(): void {
    this.events();
  }

  public ngOnChanges(): void {
    this.filteredWorkflows = this.project.workflows.filter(
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

  public events() {
    this.wsService
      .projectEvents<{ story: StoryDetail }>('stories.update')
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        const workflowURL = `project/${this.project.id}/${this.project.slug}/kanban/${msg.event.content.story.workflow.slug}`;
        this.appService.toastNotification({
          message: 'move.confirm',
          paramsMessage: {
            workflowURL,
            workflowName: msg.event.content.story.workflow.name,
          },
          status: TuiNotification.Info,
          scope: 'story',
          autoClose: true,
        });
      });
  }
}
