/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TuiActiveZoneModule, TuiAutoFocusModule } from '@taiga-ui/cdk';
import {
  TuiDataListModule,
  TuiDropdownModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { TuiComboBoxModule, TuiDataListWrapperModule } from '@taiga-ui/kit';

import { RolesPermissionsEffects } from '~/app/modules/project/settings/feature-roles-permissions/+state/effects/roles-permissions.effects';
import { rolesPermissionsFeature } from '~/app/modules/project/settings/feature-roles-permissions/+state/reducers/roles-permissions.reducer';
import { InvitationEffects } from '~/app/shared/invite-user-modal/data-access/+state/effects/invitation.effects';
import { invitationFeature } from '~/app/shared/invite-user-modal/data-access/+state/reducers/invitation.reducers';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';

import { UserToInviteComponent } from './components/user-to-invite.component';
import { InviteUserModalComponent } from './invite-user-modal.component';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    UserAvatarComponent,
    TuiLinkModule,
    TuiSvgModule,
    TuiDataListModule,
    TuiScrollbarModule,
    TuiDropdownModule,
    TuiActiveZoneModule,
    TuiComboBoxModule,
    TuiDataListWrapperModule,
    UserToInviteComponent,
    StoreModule.forFeature(rolesPermissionsFeature),
    StoreModule.forFeature(invitationFeature),
    EffectsModule.forFeature([RolesPermissionsEffects, InvitationEffects]),
    TuiAutoFocusModule,
    UserCardComponent,
    InviteUserModalComponent,
  ],
  exports: [InviteUserModalComponent],
})
export class InviteUserModalModule {}
