/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { exampleAction } from '../actions/project.actions';
import { projectFeature, initialState } from './project.reducer';

describe('Project Reducer', () => {
  it('example', () => {
    const action = exampleAction();

    const result = projectFeature.reducer(initialState, action);

    expect(result).toBe(initialState);
  });
});
