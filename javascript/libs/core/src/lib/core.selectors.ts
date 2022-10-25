/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromCore from './core.reducer';

export const selectCoreState = createFeatureSelector<fromCore.CoreState>(
  fromCore.coreFeatureKey
);

export const selectGlobalLoading = createSelector(
  selectCoreState,
  (state: fromCore.CoreState) => state.loading
);

export const selectLanguages = createSelector(
  selectCoreState,
  (state: fromCore.CoreState) => state.languages
);
