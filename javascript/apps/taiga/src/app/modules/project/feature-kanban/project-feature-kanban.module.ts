/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { A11yModule } from '@angular/cdk/a11y';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiActiveZoneModule, TuiAutoFocusModule } from '@taiga-ui/cdk';
import {
  TuiButtonModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { ModalModule } from 'libs/ui/src/lib/modal/modal.module';
import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';
import { InViewportDirective } from '~/app/shared/directives/in-viewport.directive';
import { StatusScrollDynamicHeightDirective } from '~/app/modules/project/feature-kanban/directives/status-scroll-dynamic-height/scroll-dynamic-height.directive';
import { InviteToProjectModule } from '~/app/shared/invite-to-project/invite-to-project.module';
import { TitleComponent } from '~/app/shared/title/title.component';
import { KanbanCreateTaskInlineComponent } from './components/create-task-inline/kanban-create-task-inline.component';
import { KanbanStatusComponent } from './components/status/kanban-status.component';
import { KanbanTaskComponent } from './components/task/kanban-task.component';
import { KanbanWorkflowKeyboardNavigationDirective } from './components/workflow/kanban-workflow-keyboard-navigation.directive';
import { KanbanWorkflowComponent } from './components/workflow/kanban-workflow.component';
import { DataAccessKanbanModule } from './data-access/kanban-data-access.module';
import { ProjectFeatureKanbanRoutingModule } from './project-feature-kanban-routing.module';
import { ProjectFeatureKanbanComponent } from './project-feature-kanban.component';
import { KanbanVirtualScrollDirective } from './custom-scroll-strategy/kanban-scroll-strategy';

@NgModule({
  declarations: [
    ProjectFeatureKanbanComponent,
    KanbanStatusComponent,
    KanbanWorkflowComponent,
    KanbanWorkflowKeyboardNavigationDirective,
    KanbanTaskComponent,
    KanbanCreateTaskInlineComponent,
    StatusScrollDynamicHeightDirective,
    KanbanVirtualScrollDirective,
  ],
  imports: [
    TuiAutoFocusModule,
    TuiLinkModule,
    TuiButtonModule,
    HasPermissionDirective,
    TitleComponent,
    CommonModule,
    TranslocoModule,
    ProjectFeatureKanbanRoutingModule,
    TuiSvgModule,
    ModalModule,
    InviteToProjectModule,
    DataAccessKanbanModule,
    ScrollingModule,
    TuiScrollbarModule,
    InViewportDirective,
    A11yModule,
    InputsModule,
    TuiActiveZoneModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'kanban',
    },
  ],
})
export class ProjectFeatureKanbanModule {}
