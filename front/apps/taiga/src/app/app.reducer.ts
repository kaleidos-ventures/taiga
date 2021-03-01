/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { createReducer, on } from '@ngrx/store';
import { unhandleError } from './app.actions';

export interface AppState {
  error: any;
}

export const initialState: AppState = {
  error: null
};

export const reducer = createReducer(
  initialState,

  on(unhandleError, (state, error) => {
    return {
      ...state,
      error
    };
  }),
);
