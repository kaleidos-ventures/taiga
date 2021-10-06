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
  skeleton: boolean,
}

export const initialState: WorkspaceState = {
  workspaces: [],
  skeleton: false,
};

export const reducer = createReducer(
  initialState,
  on(WorkspaceActions.setWorkspaceList, (state, { workspaces }): WorkspaceState => {
    state.workspaces = workspaces;
    state.skeleton = false;

    return state;
  }),
  on(WorkspaceActions.fetchWorkspaceList, (state): WorkspaceState => {
    state.skeleton = true;

    return state;
  }),
);

export const workspaceFeature = createFeature({
  name: 'workspaceList',
  reducer: immerReducer(reducer),
});
