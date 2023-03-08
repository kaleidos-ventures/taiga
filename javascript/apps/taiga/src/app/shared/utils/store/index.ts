/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import {
  Action,
  ActionCreator,
  ActionReducer,
  createReducer,
  ReducerTypes,
} from '@ngrx/store';
import { produce } from 'immer';

export function immerReducer<T>(
  reducer: ActionReducer<T, Action>
): ActionReducer<T, Action> {
  return (state: T | undefined, next: Action) => {
    return produce(state, (draft: T) => reducer(draft, next)) as T;
  };
}

export function createImmerReducer<S>(
  initialState: S,
  ...ons: ReducerTypes<S, readonly ActionCreator[]>[]
) {
  const reducer = createReducer(initialState, ...ons);

  return immerReducer(reducer);
}
