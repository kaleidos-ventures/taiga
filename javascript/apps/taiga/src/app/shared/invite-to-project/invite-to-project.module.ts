/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';
import { BadgeModule } from 'libs/ui/src/lib/badge/badge.module';
import { TranslocoModule } from '@ngneat/transloco';
import {
  TuiButtonModule,
  TuiSvgModule,
  TuiLinkModule,
  TuiDataListModule,
  TuiScrollbarModule,
  TuiDropdownModule,
} from '@taiga-ui/core';
import { TuiComboBoxModule, TuiDataListWrapperModule } from '@taiga-ui/kit';
import { InviteToProjectComponent } from './invite-to-project.component';
import { UserAvatarModule } from '~/app/shared/user-avatar/user-avatar.component.module';
import { UserToInviteModule } from './components/user-to-invite.module';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { rolesPermissionsFeature } from '~/app/modules/project/settings/feature-roles-permissions/+state/reducers/roles-permissions.reducer';
import { RolesPermissionsEffects } from '~/app/modules/project/settings/feature-roles-permissions/+state/effects/roles-permissions.effects';
import { invitationFeature } from '~/app/shared/invite-to-project/data-access/+state/reducers/invitation.reducers';
import { InvitationEffects } from '~/app/shared/invite-to-project/data-access/+state/effects/invitation.effects';
import { TuiActiveZoneModule, TuiAutoFocusModule } from '@taiga-ui/cdk';
import { ButtonLoadingModule } from '../directives/button-loading/button-loading.module';
import { UserCardModule } from '~/app/shared/user-card/user-card-component.module';
import { CapitalizePipeModule } from '../pipes/capitalize/capitalize.pipe.module';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    UserAvatarModule,
    TuiButtonModule,
    TuiLinkModule,
    InputsModule,
    BadgeModule,
    TuiSvgModule,
    TranslocoModule,
    TuiDataListModule,
    TuiScrollbarModule,
    TuiDropdownModule,
    TuiActiveZoneModule,
    TuiComboBoxModule,
    TuiDataListWrapperModule,
    UserToInviteModule,
    ContextNotificationModule,
    StoreModule.forFeature(rolesPermissionsFeature),
    StoreModule.forFeature(invitationFeature),
    EffectsModule.forFeature([RolesPermissionsEffects, InvitationEffects]),
    TuiAutoFocusModule,
    ButtonLoadingModule,
    UserCardModule,
    CapitalizePipeModule,
  ],
  declarations: [InviteToProjectComponent],
  exports: [InviteToProjectComponent],
})
export class InviteToProjectModule {}
