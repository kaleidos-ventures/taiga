/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createAction, props } from '@ngrx/store';
import { ErrorsState } from '../reducers/errors.reducer';

export const unexpectedError = createAction(
  '[Errors] Unexpected error',
  props<{ error: ErrorsState['unexpectedError'] }>()
);

export const forbidenError = createAction(
  '[Errors] Forbiden error',
  props<{ error: ErrorsState['forbidenError'] }>()
);

export const notFoundError = createAction(
  '[Errors] Not Found error',
  props<{ error: ErrorsState['notFoundError'] }>()
);

export const revokedError = createAction(
  '[Errors] Revoked error',
  props<{ error: ErrorsState['unexpectedError'] }>()
);
