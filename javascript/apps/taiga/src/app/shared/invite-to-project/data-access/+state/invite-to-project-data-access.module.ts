/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { InvitationEffects } from './effects/invitation.effects';
import { invitationFeature } from './reducers/invitation.reducers';

@NgModule({
  imports: [
    StoreModule.forFeature(invitationFeature),
    EffectsModule.forFeature([InvitationEffects]),
  ],
})
export class DataAccessInvitationToProjectModule {}
