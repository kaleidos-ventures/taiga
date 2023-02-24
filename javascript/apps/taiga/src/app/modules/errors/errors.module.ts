/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { ErrorsEffects } from './+state/effects/errors.effects';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { errorsFeature } from './+state/reducers/errors.reducer';
import { StoreModule } from '@ngrx/store';

@NgModule({
  declarations: [],
  imports: [
    RouterModule,
    StoreModule.forFeature(errorsFeature),
    EffectsModule.forFeature([ErrorsEffects]),
  ],
})
export class ErrorsModule {}
