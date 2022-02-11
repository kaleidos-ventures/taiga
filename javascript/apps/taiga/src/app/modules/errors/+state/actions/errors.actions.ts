/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { ErrorsState } from '../reducers/errors.reducer';

export const unexpectedError = createAction(
  '[Errors] Unexpected error',
  props<{ error: ErrorsState['unexpectedError'] }>()
);

export const errorSuccess = createAction('[Errors] An error has ocurred');
