/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createReducer, on, createFeature } from '@ngrx/store';
import { immerReducer } from '@/app/shared/utils/store';
import * as ProjectActions from '../actions/project.actions';
import { Project } from '@taiga/data';

export const projectFeatureKey = 'project';

export interface ProjectState {
  project: Project
}

export const initialState: ProjectState = {
  project: {
    id: 0,
    slug: '',
    milestones: []
  }
};

export const reducer = createReducer(
  initialState,
  on(ProjectActions.setProject, (state, { project }): ProjectState => {
    state.project = project;

    return state;
  }),
);

export const projectFeature = createFeature({
  name: 'project',
  reducer: immerReducer(reducer),
});
