/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { createReducer, on } from '@ngrx/store';
import { unexpectedError } from './app.actions';

export interface AppState {
  unexpectedError?: {
    message: string;
  };
}

export const initialState: AppState = {};

export const reducer = createReducer(
  initialState,

  on(unexpectedError, (state, { error }) => {
    return {
      ...state,
      unexpectedError: error
    };
  }),
);
