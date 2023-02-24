/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { KanbanEffects } from './+state/effects/kanban.effects';
import { kanbanFeature } from './+state/reducers/kanban.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature(kanbanFeature),
    EffectsModule.forFeature([KanbanEffects]),
  ],
})
export class DataAccessKanbanModule {}
