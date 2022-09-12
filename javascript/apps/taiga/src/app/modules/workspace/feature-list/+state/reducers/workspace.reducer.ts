/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state//actions/invitation.action';
import { immerReducer } from '~/app/shared/utils/store';
import * as WorkspaceActions from '../actions/workspace.actions';

export interface WorkspaceState {
  workspaces: Workspace[];
  loadingWorkspaces: string[];
  creatingWorkspace: boolean;
  loading: boolean;
  createFormHasError: boolean;
  workspaceProjects: Record<Workspace['slug'], WorkspaceProject[]>;
  rejectedInvites: Project['slug'][];
}

export const initialState: WorkspaceState = {
  workspaces: [],
  loadingWorkspaces: [],
  creatingWorkspace: false,
  loading: false,
  createFormHasError: false,
  workspaceProjects: {},
  rejectedInvites: [],
};

export const reducer = createReducer(
  initialState,
  on(WorkspaceActions.fetchWorkspaceList, (state): WorkspaceState => {
    state.loading = true;

    return state;
  }),
  on(
    WorkspaceActions.fetchWorkspaceListSuccess,
    (state, { workspaces }): WorkspaceState => {
      state.workspaces = workspaces;
      state.loading = false;

      state.workspaces.forEach((workspace) => {
        state.workspaceProjects[workspace.slug] = workspace.latestProjects;
      });

      return state;
    }
  ),
  on(WorkspaceActions.createWorkspace, (state): WorkspaceState => {
    state.creatingWorkspace = true;
    state.createFormHasError = false;

    return state;
  }),
  on(
    WorkspaceActions.createWorkspaceSuccess,
    (state, { workspace }): WorkspaceState => {
      state.workspaces = [workspace, ...state.workspaces];
      state.creatingWorkspace = false;

      return state;
    }
  ),
  on(WorkspaceActions.createWorkspaceError, (state): WorkspaceState => {
    state.creatingWorkspace = false;

    return state;
  }),
  on(
    WorkspaceActions.createFormHasError,
    (state, { hasError }): WorkspaceState => {
      state.createFormHasError = hasError;

      return state;
    }
  ),
  on(
    WorkspaceActions.fetchWorkspaceProjects,
    (state, { slug }): WorkspaceState => {
      state.loadingWorkspaces.push(slug);

      return state;
    }
  ),
  on(
    WorkspaceActions.fetchWorkspaceProjectsSuccess,
    (state, { slug, projects }): WorkspaceState => {
      state.workspaceProjects[slug] = projects.map((project) => {
        return {
          name: project.name,
          slug: project.slug,
          description: project.description,
          color: project.color,
          logoSmall: project.logoSmall,
        } as WorkspaceProject;
      });
      state.loadingWorkspaces = [];
      return state;
    }
  ),
  on(
    WorkspaceActions.fetchWorkspaceInvitationsSuccess,
    (
      state,
      {
        projectSlug,
        workspaceSlug,
        invitations,
        project,
        role,
        rejectedInvites,
      }
    ): WorkspaceState => {
      const currentWorkspaceIndex = state.workspaces.findIndex((workspace) => {
        return workspace.slug === workspaceSlug;
      });

      // Add invitation if you are not admin, if you are admin transform the invitation in a project inside the workspace.
      if (role !== 'admin') {
        const invitationToAdd = invitations.filter((project) => {
          return project.slug === projectSlug;
        });

        state.workspaces[currentWorkspaceIndex].invitedProjects.unshift(
          invitationToAdd[0]
        );
      } else {
        const projectToAdd = project.filter((project) => {
          return project.slug === projectSlug;
        });
        state.workspaces[currentWorkspaceIndex].totalProjects++;
        state.workspaceProjects[workspaceSlug].unshift(projectToAdd[0]);
      }

      if (role === 'guest') {
        // This is only done on guest because is not to be done on empty state workspaces and only guest can get hidden workspaces.
        // Get a list of current workspace rejected invites
        const workspaceRejectedInvites = state.workspaces[
          currentWorkspaceIndex
        ].invitedProjects.filter((project) => {
          return rejectedInvites.includes(project.slug);
        });

        // Put the workspace in the first place if there is nothing visually inside the workspace when called to emulate a new workspace creation until refresh, only if you are not admin.
        // -1 on the length is to remove the current invitation from the equation
        if (
          workspaceRejectedInvites.length ===
            state.workspaces[currentWorkspaceIndex].invitedProjects.length -
              1 &&
          !state.workspaceProjects[workspaceSlug].length
        ) {
          state.workspaces.splice(
            0,
            0,
            state.workspaces.splice(currentWorkspaceIndex, 1)[0]
          );
        }
      }

      return state;
    }
  ),
  on(
    WorkspaceActions.fetchWorkspaceSuccess,
    (state, { workspace }): WorkspaceState => {
      state.workspaces.unshift(workspace);
      return state;
    }
  ),
  on(WorkspaceActions.resetWorkspace, (state): WorkspaceState => {
    state = {
      ...initialState,
    };

    return state;
  }),
  on(
    WorkspaceActions.setWorkspaceListRejectedInvites,
    (state, { projects }): WorkspaceState => {
      state.rejectedInvites = projects;
      return state;
    }
  ),
  on(
    InvitationActions.revokeInvitation,
    (state, { projectSlug }): WorkspaceState => {
      state.rejectedInvites.push(projectSlug);

      return state;
    }
  ),
  on(
    WorkspaceActions.invitationRevokedEvent,
    (state, { slug, workspace }): WorkspaceState => {
      const indexWorkspace = state.workspaces.findIndex((currentWorkspace) => {
        return currentWorkspace.slug === slug;
      });
      state.workspaces[indexWorkspace] = workspace;

      return state;
    }
  )
);

export const workspaceFeature = createFeature({
  name: 'workspaceList',
  reducer: immerReducer(reducer),
});
