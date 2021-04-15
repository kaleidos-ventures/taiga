/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
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
