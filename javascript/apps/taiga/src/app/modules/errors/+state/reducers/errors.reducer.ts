/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { immerReducer } from '~/app/shared/utils/store';
import * as ErrorsActions from '../actions/errors.actions';

export interface ErrorsState {
  unexpectedError: {
    message: string;
  };
}

export const initialState: ErrorsState = {
  unexpectedError: {
    message: '',
  },
};

export const reducer = createReducer(
  initialState,
  on(ErrorsActions.unexpectedError, (state, { error }): ErrorsState => {
    state.unexpectedError.message = error.message;

    return state;
  })
);

export const errorsFeature = createFeature({
  name: 'error',
  reducer: immerReducer(reducer),
});
