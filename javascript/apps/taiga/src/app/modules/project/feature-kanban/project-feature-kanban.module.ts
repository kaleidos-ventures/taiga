/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiActiveZoneModule, TuiAutoFocusModule } from '@taiga-ui/cdk';
import {
  TuiHintModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { ModalModule } from 'libs/ui/src/lib/modal/modal.module';
import { ProjectFeatureStoryWrapperModalViewModule } from '~/app/modules/project//feature-story-wrapper-modal-view/project-feature-story-wrapper-modal-view.module';
import { StatusScrollDynamicHeightDirective } from '~/app/modules/project/feature-kanban/directives/status-scroll-dynamic-height/scroll-dynamic-height.directive';
import { ProjectFeatureStoryWrapperSideViewModule } from '~/app/modules/project/feature-story-wrapper-side-view/project-feature-story-wrapper-side-view.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { AutoFocusDirective } from '~/app/shared/directives/auto-focus/auto-focus.directive';
import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';
import { InViewportDirective } from '~/app/shared/directives/in-viewport.directive';
import { OutsideClickDirective } from '~/app/shared/directives/outside-click/outside-click.directive';
import { RestoreFocusTargetDirective } from '~/app/shared/directives/restore-focus/restore-focus-target.directive';
import { RestoreFocusDirective } from '~/app/shared/directives/restore-focus/restore-focus.directive';
import { DragModule } from '~/app/shared/drag/drag.module';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { InviteUserModalModule } from '~/app/shared/invite-user-modal/invite-user-modal.module';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { TitleComponent } from '~/app/shared/title/title.component';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { AssignUserComponent } from '../components/assign-user/assign-user.component';
import { KanbanCreateStatusComponent } from './components/create-status/kanban-create-status.component';
import { KanbanCreateStoryInlineComponent } from './components/create-story-inline/kanban-create-story-inline.component';
import { EditStatusComponent } from './components/edit-status/edit-status.component';
import { KanbanStatusComponent } from './components/status/kanban-status.component';
import { A11yDragStoryDirective } from './components/story/kanban-story-a11y-drag.directive';
import { KanbanStoryComponent } from './components/story/kanban-story.component';
import { KanbanWorkflowComponent } from './components/workflow/kanban-workflow.component';
import { DeleteStatusComponent } from './components/delete-status/delete-status.component';
import { KanbanEmptyComponent } from './components/empty/kanban-empty.component';
import { KanbanVirtualScrollDirective } from './custom-scroll-strategy/kanban-scroll-strategy';
import { DataAccessKanbanModule } from './data-access/kanban-data-access.module';
import { KanbanStatusKeyboardNavigationDirective } from './directives/kanban-status-keyboard-navigation/kanban-status-keyboard-navigation.directive';
import { KanbanStoryKeyboardNavigationDirective } from './directives/kanban-story-keyboard-navigation/kanban-story-keyboard-navigation.directive';
import { ProjectFeatureKanbanComponent } from './project-feature-kanban.component';

@NgModule({
  declarations: [
    ProjectFeatureKanbanComponent,
    KanbanStatusComponent,
    KanbanCreateStatusComponent,
    KanbanWorkflowComponent,
    KanbanStoryKeyboardNavigationDirective,
    KanbanStatusKeyboardNavigationDirective,
    KanbanStoryComponent,
    KanbanCreateStoryInlineComponent,
    StatusScrollDynamicHeightDirective,
    KanbanVirtualScrollDirective,
    A11yDragStoryDirective,
    EditStatusComponent,
  ],
  exports: [ProjectFeatureKanbanComponent],

  imports: [
    UserAvatarComponent,
    TuiAutoFocusModule,
    TuiLinkModule,
    TuiHintModule,
    HasPermissionDirective,
    TitleComponent,
    CommonTemplateModule,
    TuiSvgModule,
    ModalModule,
    InviteUserModalModule,
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
    ResizedDirective,
    RouterModule,
    DropdownModule,
    AssignUserComponent,
    OutsideClickDirective,
    RestoreFocusTargetDirective,
    RestoreFocusDirective,
    AutoFocusDirective,
    DeleteStatusComponent,
    KanbanEmptyComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'kanban',
    },
  ],
})
export class ProjectFeatureKanbanModule {}
