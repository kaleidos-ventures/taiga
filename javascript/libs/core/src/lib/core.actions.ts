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
