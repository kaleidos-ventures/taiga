/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { createReducer, on } from '@ngrx/store';
import { unexpectedError, globalLoading } from './core.actions';

export const coreFeatureKey = 'core';

export interface CoreState {
  loading: boolean;
  unexpectedError?: {
    message: string;
  };
}

export const initialState: CoreState = {
  loading: false,
};

export const reducer = createReducer(
  initialState,

  on(unexpectedError, (state, { error }) => {
    return {
      ...state,
      unexpectedError: error
    };
  }),

  on(globalLoading, (state, { loading }) => {
    return {
      ...state,
      loading
    };
  }),
);
