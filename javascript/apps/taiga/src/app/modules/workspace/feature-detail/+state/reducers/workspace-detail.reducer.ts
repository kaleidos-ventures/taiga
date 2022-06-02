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
  workspace: Workspace | null;
  workspaceProjects: Project[];
  workspaceInvitedProjects: Project[];
  loading: boolean;
}

export const initialState: WorkspaceDetailState = {
  workspace: null,
  loading: false,
  workspaceProjects: [],
  workspaceInvitedProjects: [],
};

export const reducer = createReducer(
  initialState,
  on(WorkspaceActions.fetchWorkspace, (state): WorkspaceDetailState => {
    state.loading = true;

    return state;
  }),
  on(
    WorkspaceActions.fetchWorkspaceSuccess,
    (state, { workspace }): WorkspaceDetailState => {
      state.workspace = workspace;
      state.loading = false;

      return state;
    }
  ),
  on(
    WorkspaceActions.fetchWorkspaceProjectsSuccess,
    (state, { projects, invitedProjects }): WorkspaceDetailState => {
      state.workspaceProjects = projects;
      state.workspaceInvitedProjects = invitedProjects;

      return state;
    }
  ),
  on(WorkspaceActions.resetWorkspace, (state): WorkspaceDetailState => {
    state.workspace = null;

    return state;
  })
);

export const workspaceDetailFeature = createFeature({
  name: 'workspace',
  reducer: immerReducer(reducer),
});
