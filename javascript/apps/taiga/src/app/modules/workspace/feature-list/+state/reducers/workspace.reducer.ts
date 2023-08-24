/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, on } from '@ngrx/store';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import {
  invitationProjectActions,
  revokeInvitation,
} from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';
import { createImmerReducer } from '~/app/shared/utils/store';
import * as WorkspaceActions from '../actions/workspace.actions';
import { workspaceEventActions } from '../actions/workspace.actions';

export interface WorkspaceState {
  workspaces: Workspace[];
  loadingWorkspaces: string[];
  creatingWorkspace: boolean;
  loading: boolean;
  createFormHasError: boolean;
  workspaceProjects: Record<Workspace['id'], WorkspaceProject[]>;
  rejectedInvites: Project['id'][];
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

export const reducer = createImmerReducer(
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
        state.workspaceProjects[workspace.id] = workspace.latestProjects;
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
    (state, { id }): WorkspaceState => {
      state.loadingWorkspaces.push(id);

      return state;
    }
  ),
  on(
    WorkspaceActions.fetchWorkspaceProjectsSuccess,
    (state, { id, projects }): WorkspaceState => {
      state.workspaceProjects[id] = projects.map((project) => {
        return {
          name: project.name,
          id: project.id,
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
      { projectId, workspaceId, invitations, project, role, rejectedInvites }
    ): WorkspaceState => {
      const currentWorkspaceIndex = state.workspaces.findIndex((workspace) => {
        return workspace.id === workspaceId;
      });

      // Add invitation if you are not admin, if you are admin transform the invitation in a project inside the workspace.
      if (role !== 'member') {
        const invitationToAdd = invitations.filter((project) => {
          return project.id === projectId;
        });

        const existInside = state.workspaces[
          currentWorkspaceIndex
        ].invitedProjects.findIndex((it) => it.id === invitationToAdd[0].id);

        if (existInside < 0) {
          state.workspaces[currentWorkspaceIndex].invitedProjects.unshift(
            invitationToAdd[0]
          );
        }
      } else {
        const projectToAdd = project.filter((project) => {
          return project.id === projectId;
        });
        if (state.workspaces[currentWorkspaceIndex].latestProjects.length < 5) {
          state.workspaces[currentWorkspaceIndex].latestProjects.unshift(
            projectToAdd[0]
          );
        }
        state.workspaces[currentWorkspaceIndex].totalProjects++;
        state.workspaceProjects[workspaceId].unshift(projectToAdd[0]);
      }

      if (role === 'guest') {
        // This is only done on guest because is not to be done on empty state workspaces and only guest can get hidden workspaces.
        // Get a list of current workspace rejected invites
        const workspaceRejectedInvites = state.workspaces[
          currentWorkspaceIndex
        ].invitedProjects.filter((project) => {
          return rejectedInvites.includes(project.id);
        });

        // Put the workspace in the first place if there is nothing visually inside the workspace when called to emulate a new workspace creation until refresh, only if you are not admin.
        // -1 on the length is to remove the current invitation from the equation
        if (
          workspaceRejectedInvites.length ===
            state.workspaces[currentWorkspaceIndex].invitedProjects.length -
              1 &&
          !state.workspaceProjects[workspaceId].length
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
  on(
    invitationProjectActions.acceptInvitationIdError,
    (state, { error, projectId }): WorkspaceState => {
      if (error === 404) {
        state.workspaces = state.workspaces.map((workspace) => {
          workspace.invitedProjects = workspace.invitedProjects.filter(
            (project) => {
              return project.id !== projectId;
            }
          );

          return workspace;
        });
      }

      return state;
    }
  ),
  on(
    WorkspaceActions.projectDeletedSuccess,
    (state, { updatedWorkspace, projectId }): WorkspaceState => {
      if (updatedWorkspace) {
        const workspaceIndex = state.workspaces.findIndex((workspaceItem) => {
          return workspaceItem.id === updatedWorkspace.id;
        });

        if (workspaceIndex >= 0 && state.workspaces[workspaceIndex]) {
          state.workspaces[workspaceIndex].invitedProjects = state.workspaces[
            workspaceIndex
          ].invitedProjects.filter((invitedProject) => {
            return invitedProject.id !== projectId;
          });

          state.workspaces[workspaceIndex].latestProjects = state.workspaces[
            workspaceIndex
          ].latestProjects.filter((project) => {
            return project.id !== projectId;
          });
        }

        if (
          workspaceIndex >= 0 &&
          state.workspaceProjects[updatedWorkspace.id]
        ) {
          state.workspaceProjects[updatedWorkspace.id] =
            state.workspaceProjects[updatedWorkspace.id].filter((project) => {
              return project.id !== projectId;
            });
          state.workspaces[workspaceIndex].totalProjects =
            state.workspaceProjects[updatedWorkspace.id].length;
        }
      }

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
  on(revokeInvitation, (state, { projectId }): WorkspaceState => {
    state.rejectedInvites.push(projectId);

    return state;
  }),
  on(
    WorkspaceActions.invitationRevokedEvent,
    (state, { workspace }): WorkspaceState => {
      state.workspaces = state.workspaces.map((it) => {
        if (it.id === workspace.id) {
          return workspace;
        }
        return it;
      });
      return state;
    }
  ),
  on(
    workspaceEventActions.projectDeleted,
    workspaceEventActions.projectMembershipLost,
    (state, { workspaceId }): WorkspaceState => {
      const workspace = state.workspaces.find((workspace) => {
        return workspace.id === workspaceId;
      });
      if (
        workspace &&
        workspace.invitedProjects.length + workspace.totalProjects - 1 <= 0 &&
        workspace.userRole === 'guest'
      ) {
        state.workspaces = state.workspaces.filter((it) => {
          return it.id !== workspaceId;
        });
      }

      return state;
    }
  ),
  on(
    WorkspaceActions.workspaceMembershipLostSuccess,
    (state, { workspaceId, updatedWorkspace }): WorkspaceState => {
      if (updatedWorkspace) {
        const workspaceIndex = state.workspaces.findIndex((workspaceItem) => {
          return workspaceItem.id === workspaceId;
        });

        state.workspaces[workspaceIndex] = updatedWorkspace;
      }

      return state;
    }
  ),
  on(
    WorkspaceActions.workspaceMembershipLostError,
    (state, { workspaceId }): WorkspaceState => {
      const workspaces = state.workspaces.filter((workspaceItem) => {
        return workspaceItem.id !== workspaceId;
      });

      state.workspaces = workspaces;

      return state;
    }
  ),
  on(
    WorkspaceActions.workspaceEventActions.workspaceDeleted,
    (state, { workspaceId }): WorkspaceState => {
      state.workspaces = state.workspaces.filter((it) => {
        return it.id !== workspaceId;
      });
      return state;
    }
  )
);

export const workspaceFeature = createFeature({
  name: 'workspace',
  reducer,
});
