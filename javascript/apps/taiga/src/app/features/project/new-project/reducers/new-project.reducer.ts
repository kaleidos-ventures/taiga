/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createReducer, on, createFeature } from '@ngrx/store';
import { Project } from '@taiga/data';
import { immerReducer } from '~/app/shared/utils/store';
import * as NewProjectActions from '../actions/new-project.actions';

export interface NewProjectState {
  project: Project | null;
}

export const initialState: NewProjectState = {
  project: null
};

const reducer = createReducer(
  initialState,
  on(NewProjectActions.createProjectSuccess, (state, { project }):
  NewProjectState => {
    state.project = project;
    return state;
  }),
);

export const newProjectFeature = createFeature({
  name: 'newProject',
  reducer: immerReducer(reducer),
});
