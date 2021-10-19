/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createReducer, on, createFeature } from '@ngrx/store';
import { Workspace } from '@taiga/data';
import { immerReducer } from '~/app/shared/utils/store';
import * as WorkspaceActions from '../actions/workspace.actions';

export interface WorkspaceState {
  workspaces: Workspace[],
  creatingWorkspace: boolean,
  loading: boolean,
  createFormHasError: boolean
}

export const initialState: WorkspaceState = {
  workspaces: [],
  creatingWorkspace: false,
  loading: false,
  createFormHasError: false
};

export const reducer = createReducer(
  initialState,
  on(WorkspaceActions.fetchWorkspaceList, (state): WorkspaceState => {
    state.loading = true;

    return state;
  }),
  on(WorkspaceActions.fetchWorkspaceListSuccess, (state, { workspaces }): WorkspaceState => {
    state.workspaces = workspaces;
    state.loading = false;

    return state;
  }),
  on(WorkspaceActions.createWorkspace, (state): WorkspaceState => {
    state.creatingWorkspace = true;
    state.createFormHasError = false;

    return state;
  }),
  on(WorkspaceActions.createWorkspaceSuccess, (state, { workspace }): WorkspaceState => {
    state.workspaces = [workspace, ...state.workspaces];
    state.creatingWorkspace = false;

    return state;
  }),
  on(WorkspaceActions.createFormHasError, (state, { hasError }): WorkspaceState => {
    state.createFormHasError = hasError;

    return state;
  }),
);

export const workspaceFeature = createFeature({
  name: 'workspaceList',
  reducer: immerReducer(reducer),
});
