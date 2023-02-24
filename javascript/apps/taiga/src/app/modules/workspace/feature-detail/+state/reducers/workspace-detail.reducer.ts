/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import { immerReducer } from '~/app/shared/utils/store';
import * as WorkspaceActions from '../actions/workspace-detail.actions';
import { workspaceDetailEventActions } from '../actions/workspace-detail.actions';

export interface WorkspaceDetailState {
  workspace: Workspace | null;
  creatingWorkspaceDetail: boolean;
  projects: Project[];
  workspaceProjects: Record<Workspace['id'], WorkspaceProject[]>;
  workspaceInvitedProjects: Project[];
  loading: boolean;
}

export const initialState: WorkspaceDetailState = {
  workspace: null,
  projects: [],
  creatingWorkspaceDetail: true,
  loading: false,
  workspaceProjects: {},
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
      state.projects = projects;
      state.workspaceInvitedProjects = invitedProjects;
      state.creatingWorkspaceDetail = false;
      return state;
    }
  ),
  on(WorkspaceActions.resetWorkspace, (state): WorkspaceDetailState => {
    state.workspace = null;
    state.projects = [];
    state.workspaceInvitedProjects = [];
    state.creatingWorkspaceDetail = true;

    return state;
  }),
  on(
    WorkspaceActions.invitationDetailRevokedEvent,
    (state, { projectId }): WorkspaceDetailState => {
      state.workspaceInvitedProjects = state.workspaceInvitedProjects.filter(
        (project) => {
          return project.id !== projectId;
        }
      );

      return state;
    }
  ),
  on(
    WorkspaceActions.fetchWorkspaceDetailInvitationsSuccess,
    (
      state,
      { projectId, invitations, project, role }
    ): WorkspaceDetailState => {
      // Add invitation if you are not admin, if you are admin transform the invitation in a project inside the workspace.
      if (role !== 'admin') {
        const invitationToAdd = invitations.filter((project) => {
          return project.id === projectId;
        });
        state.workspaceInvitedProjects.unshift(invitationToAdd[0]);
      } else {
        const projectToAdd = project.filter((project) => {
          return project.id === projectId;
        });
        state.projects.unshift(projectToAdd[0]);
      }

      return state;
    }
  ),
  on(
    workspaceDetailEventActions.projectDeleted,
    (state, { projectId }): WorkspaceDetailState => {
      state.workspaceInvitedProjects = state.workspaceInvitedProjects.filter(
        (project) => {
          return project.id !== projectId;
        }
      );

      state.projects = state.projects.filter((project) => {
        return project.id !== projectId;
      });
      if (
        state.workspace &&
        !state.projects.length &&
        !state.workspaceInvitedProjects.length
      ) {
        state.workspace.totalProjects = 0;
      }
      return state;
    }
  )
);

export const workspaceDetailFeature = createFeature({
  name: 'workspaceDetail',
  reducer: immerReducer(reducer),
});
