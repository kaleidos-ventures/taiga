/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { A11yModule } from '@angular/cdk/a11y';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TuiActiveZoneModule } from '@taiga-ui/cdk';
import {
  TuiDataListModule,
  TuiHintModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { ModalModule } from '@taiga/ui/modal';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { AutoFocusDirective } from '~/app/shared/directives/auto-focus/auto-focus.directive';
import { ClickActionAreaDirective } from '~/app/shared/directives/click-action-area/click-action-area.directive';
import { CodeHightlightDirective } from '~/app/shared/directives/code-highlight/code-highlight.directive';
import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';
import { RestoreFocusTargetDirective } from '~/app/shared/directives/restore-focus/restore-focus-target.directive';
import { RestoreFocusDirective } from '~/app/shared/directives/restore-focus/restore-focus.directive';
import { DiscardChangesModalComponent } from '~/app/shared/discard-changes-modal/discard-changes-modal.component';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { DateDistancePipe } from '~/app/shared/pipes/date-distance/date-distance.pipe';
import { SafeHtmlPipe } from '~/app/shared/pipes/safe-html/safe-html.pipe';
import { StatusColorPipe } from '~/app/shared/pipes/status-color/status-color.pipe';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { AssignUserComponent } from '../components/assign-user/assign-user.component';
import { FieldConflictComponent } from '../components/field-conflict/field-conflict.component';
import { StoryDetailAssignComponent } from './components/story-detail-assign/story-detail-assign.component';
import { StoryDetailScriptionStickyDirective } from './components/story-detail-description/story-detail-description-sticky.directive';
import { StoryDetailDescriptionComponent } from './components/story-detail-description/story-detail-description.component';
import { StoryDetailStatusComponent } from './components/story-detail-status/story-detail-status.component';
import { StoryDetailTitleComponent } from './components/story-detail-title/story-detail-title.component';
import { DataAccessStoryDetailModule } from './data-access/story-detail-data-access.module';
import { StoryDetailComponent } from './story-detail.component';

@NgModule({
  imports: [
    RouterModule,
    CommonTemplateModule,
    TuiHintModule,
    TuiLinkModule,
    TuiScrollbarModule,
    DropdownModule,
    TuiDataListModule,
    TuiSvgModule,
    UserAvatarComponent,
    A11yModule,
    DateDistancePipe,
    InputsModule,
    FormsModule,
    ReactiveFormsModule,
    DataAccessStoryDetailModule,
    StatusColorPipe,
    AssignUserComponent,
    TuiActiveZoneModule,
    ResizedDirective,
    HasPermissionDirective,
    ModalModule,
    AutoFocusDirective,
    RestoreFocusDirective,
    RestoreFocusTargetDirective,
    DiscardChangesModalComponent,
    FieldConflictComponent,
    EditorModule,
    ClickActionAreaDirective,
    SafeHtmlPipe,
    StoryDetailScriptionStickyDirective,
    CodeHightlightDirective,
  ],
  declarations: [
    StoryDetailComponent,
    StoryDetailStatusComponent,
    StoryDetailAssignComponent,
    StoryDetailTitleComponent,
    StoryDetailDescriptionComponent,
  ],
  exports: [StoryDetailComponent],
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
  ],
})
export class StoryDetailModule {}
