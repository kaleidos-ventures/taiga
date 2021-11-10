/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { newProjectFeature, initialState } from './new-project.reducer';

import { createProjectSuccess } from '../actions/new-project.actions';
import { ProjectMockFactory } from '@taiga/data';

describe('NewProject Reducer', () => {
  it('set Project success', () => {
    const project = ProjectMockFactory();
    const action = createProjectSuccess({ project });

    const result = newProjectFeature.reducer(initialState, action);

    expect(result).toEqual({project});
  });
});
