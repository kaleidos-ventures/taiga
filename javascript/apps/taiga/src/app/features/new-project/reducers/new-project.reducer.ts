/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createReducer, on, createFeature } from '@ngrx/store';
import { immerReducer } from '~/app/shared/utils/store';
import * as NewProjectActions from '../actions/new-project.actions';

export const newProjectFeatureKey = 'newProject';

export interface NewProjectState {
  reference: string
}

export const initialState: NewProjectState = {
  reference: ''
};

const reducer = createReducer(
  initialState,
  on(NewProjectActions.setReference, (state): NewProjectState => {

    return state;
  }),
);

export const newProjectFeature = createFeature({
  name: 'newProject',
  reducer: immerReducer(reducer),
});
