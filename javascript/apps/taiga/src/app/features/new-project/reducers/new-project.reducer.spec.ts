/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { setReference } from '../actions/new-project.actions';
import { newProjectFeature, initialState } from './new-project.reducer';

import * as faker from 'faker';

describe('NewProject Reducer', () => {
  it('set Reference', () => {
    const action = setReference({reference: faker.lorem.word()});

    const result = newProjectFeature.reducer(initialState, action);

    expect(result).toBe(initialState);
  });
});
