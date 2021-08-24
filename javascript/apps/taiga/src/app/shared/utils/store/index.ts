/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { produce } from 'immer';

export function immerReducer<State, Next>(
  reducer: (state: State, next: Next) => State | void,
) {
  return (state: State | undefined, next: Next) => {
    return produce(state, (draft: State) => reducer(draft, next)) as State;
  };
}
