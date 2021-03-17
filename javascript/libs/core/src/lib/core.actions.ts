/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { createAction, props } from '@ngrx/store';
import { CoreState } from './core.reducer';

export const unexpectedError = createAction(
  '[Core] Unexpected error',
  props<{error: CoreState['unexpectedError']}>()
);

export const globalLoading = createAction(
  '[Core] Global loading',
  props<{loading: boolean}>()
);
