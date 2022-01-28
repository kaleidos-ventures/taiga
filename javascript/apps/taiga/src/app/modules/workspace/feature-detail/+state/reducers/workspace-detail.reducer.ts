/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createReducer, on, createFeature } from '@ngrx/store';
import { Project, Workspace } from '@taiga/data';
import { immerReducer } from '~/app/shared/utils/store';
import * as WorkspaceActions from '../actions/workspace-detail.actions';

export interface WorkspaceDetailState {
  workspace: Workspace;
  workspaceProjects: Project[];
}

export const initialState: WorkspaceDetailState = {
  workspace: {
    id: 0,
    name: '',
    slug: '',
    color: 0,
    latestProjects: [],
    totalProjects: 0,
    isPremium: false
  },
  workspaceProjects: [],
};

export const reducer = createReducer(
  initialState,
  on(
    WorkspaceActions.fetchWorkspaceSuccess,
    (state, { workspace }): WorkspaceDetailState => {
      state.workspace = workspace;

      return state;
    }
  ),
  on(
    WorkspaceActions.fetchWorkspaceProjectsSuccess,
    (state, { projects }): WorkspaceDetailState => {
      state.workspaceProjects = projects;

      return state;
    }
  )
);

export const workspaceDetailFeature = createFeature({
  name: 'workspace',
  reducer: immerReducer(reducer),
});
