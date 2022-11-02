/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { ProjectFeatureStoryWrapperModalViewModule } from '~/app/modules/project//feature-story-wrapper-modal-view/project-feature-story-wrapper-modal-view.module';
import { StatusScrollDynamicHeightDirective } from '~/app/modules/project/feature-kanban/directives/status-scroll-dynamic-height/scroll-dynamic-height.directive';
import { ProjectFeatureStoryWrapperSideViewModule } from '~/app/modules/project/feature-story-wrapper-side-view/project-feature-story-wrapper-side-view.module';
import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';
import { InViewportDirective } from '~/app/shared/directives/in-viewport.directive';
import { DragModule } from '~/app/shared/drag/drag.module';
import { InviteToProjectModule } from '~/app/shared/invite-to-project/invite-to-project.module';
import { ResizeEventModule } from '~/app/shared/resize/resize.module';
import { TitleComponent } from '~/app/shared/title/title.component';
import { KanbanCreateStoryInlineComponent } from './components/create-story-inline/kanban-create-story-inline.component';
import { KanbanStatusComponent } from './components/status/kanban-status.component';
import { A11yDragStoryDirective } from './components/story/kanban-story-a11y-drag.directive';
import { KanbanStoryComponent } from './components/story/kanban-story.component';
import { KanbanWorkflowComponent } from './components/workflow/kanban-workflow.component';
import { KanbanVirtualScrollDirective } from './custom-scroll-strategy/kanban-scroll-strategy';
import { DataAccessKanbanModule } from './data-access/kanban-data-access.module';
import { KanbanKeyboardNavigationDirective } from './directives/kanban-workflow-keyboard-navigation/kanban-keyboard-navigation.directive';
import { ProjectFeatureKanbanComponent } from './project-feature-kanban.component';

@NgModule({
  declarations: [
    ProjectFeatureKanbanComponent,
    KanbanStatusComponent,
    KanbanWorkflowComponent,
    KanbanKeyboardNavigationDirective,
    KanbanStoryComponent,
    KanbanCreateStoryInlineComponent,
    StatusScrollDynamicHeightDirective,
    KanbanVirtualScrollDirective,
    A11yDragStoryDirective,
  ],
  exports: [ProjectFeatureKanbanComponent],

  imports: [
    TuiAutoFocusModule,
    TuiLinkModule,
    TuiButtonModule,
    HasPermissionDirective,
    TitleComponent,
    CommonModule,
    TranslocoModule,
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
    DragModule,
    ProjectFeatureStoryWrapperSideViewModule,
    ProjectFeatureStoryWrapperModalViewModule,
    DragDropModule,
    ResizeEventModule,
    RouterModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'kanban',
    },
  ],
})
export class ProjectFeatureKanbanModule {}
