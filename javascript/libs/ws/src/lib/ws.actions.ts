import { createAction, props } from '@ngrx/store';

export const wsMessage = createAction(
  '[Ws] message',
  props<{data: { [key in PropertyKey]: unknown }}>()
);
