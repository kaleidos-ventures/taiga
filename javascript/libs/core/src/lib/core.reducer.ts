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
