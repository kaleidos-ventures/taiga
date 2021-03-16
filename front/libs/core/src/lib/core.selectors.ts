/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromCore from './core.reducer';

export const selectCoreState = createFeatureSelector<fromCore.CoreState>(
  fromCore.coreFeatureKey
);

export const getGlobalLoading = createSelector(
  selectCoreState,
  (state: fromCore.CoreState) => state.loading
);
