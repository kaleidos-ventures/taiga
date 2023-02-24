/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { AuthEffects } from './+state/effects/auth.effects';
import { authFeature } from './+state/reducers/auth.reducer';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    RouterModule,
    StoreModule.forFeature(authFeature),
    EffectsModule.forFeature([AuthEffects]),
  ],
})
export class DataAccessAuthModule {}
