/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, on } from '@ngrx/store';
import {
  Project,
  Workspace,
  WorkspaceMembership,
  WorkspaceProject,
  InvitationWorkspaceMember,
} from '@taiga/data';
import { createImmerReducer } from '~/app/shared/utils/store';
import {
  workspaceActions,
  workspaceDetailActions,
  workspaceDetailApiActions,
  workspaceDetailEventActions,
} from '../actions/workspace-detail.actions';

export interface WorkspaceDetailState {
  workspace: Workspace | null;
  creatingWorkspaceDetail: boolean;
  projects: Project[];
  workspaceProjects: Record<Workspace['id'], WorkspaceProject[]>;
  workspaceInvitedProjects: Project[];
  loading: boolean;
  members: {
    membersList: WorkspaceMembership[];
    loading: boolean;
    total: number;
    offset: number;
  };
  nonMembers: {
    membersList: WorkspaceMembership[];
    loading: boolean;
    total: number;
    offset: number;
  };
  invitations: {
    membersList: InvitationWorkspaceMember[];
    loading: boolean;
    total: number;
    offset: number;
  };
  animationDisabled: boolean;
}

export const initialState: WorkspaceDetailState = {
  workspace: null,
  projects: [],
  creatingWorkspaceDetail: true,
  loading: false,
  workspaceProjects: {},
  workspaceInvitedProjects: [],
  members: {
    membersList: [],
    loading: false,
    total: 0,
    offset: 0,
  },
  nonMembers: {
    membersList: [],
    loading: false,
    total: 0,
    offset: 0,
  },
  invitations: {
    membersList: [],
    loading: false,
    total: 0,
    offset: 0,
  },
  animationDisabled: true,
};

export const reducer = createImmerReducer(
  initialState,
  on(workspaceActions.fetchWorkspace, (state): WorkspaceDetailState => {
    state.loading = true;

    return state;
  }),
  on(
    workspaceActions.fetchWorkspaceSuccess,
    (state, { workspace }): WorkspaceDetailState => {
      state.workspace = workspace;
      state.loading = false;

      return state;
    }
  ),
  on(
    workspaceActions.fetchWorkspaceProjectSuccess,
    (state, { projects, invitedProjects }): WorkspaceDetailState => {
      state.projects = projects;
      state.workspaceInvitedProjects = invitedProjects;
      state.creatingWorkspaceDetail = false;
      return state;
    }
  ),
  on(workspaceActions.resetWorkspace, (state): WorkspaceDetailState => {
    state.workspace = null;
    state.projects = [];
    state.workspaceInvitedProjects = [];
    state.creatingWorkspaceDetail = true;

    return state;
  }),
  on(
    workspaceDetailEventActions.invitationDetailRevokedEvent,
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
    workspaceDetailActions.fetchInvitationsSuccess,
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
    workspaceActions.updateWorkspaceSuccess,
    (state, { workspace }): WorkspaceDetailState => {
      if (state.workspace && workspace) {
        state.workspace = {
          ...state.workspace,
          ...workspace,
        };
      }

      return state;
    }
  ),
  on(
    workspaceActions.updateWorkspaceError,
    (state, { workspace }): WorkspaceDetailState => {
      state.workspace = workspace;

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
  ),
  on(
    workspaceActions.deleteWorkspaceProjectSuccess,
    (state, { projectId }): WorkspaceDetailState => {
      if (state.workspace) {
        if (state.projects) {
          state.projects = state.projects.filter((projects) => {
            return projects.id !== projectId;
          });
        }
        if (state.workspace.invitedProjects) {
          state.workspaceInvitedProjects =
            state.workspaceInvitedProjects.filter((invitedProject) => {
              return invitedProject.id !== projectId;
            });
        }
        if (state.workspace.latestProjects) {
          state.workspace.latestProjects =
            state.workspace.latestProjects.filter((project) => {
              return project.id !== projectId;
            });
        }
        if (state.workspaceProjects[state.workspace.id]) {
          state.workspaceProjects[state.workspace.id] = state.workspaceProjects[
            state.workspace.id
          ].filter((project) => {
            return project.id !== projectId;
          });
        }
      }
      return state;
    }
  ),
  on(
    workspaceDetailApiActions.initWorkspacePeople,
    (state): WorkspaceDetailState => {
      state.members.loading = true;

      return state;
    }
  ),
  on(
    workspaceDetailApiActions.getWorkspaceMembers,
    (state, { showLoading }): WorkspaceDetailState => {
      if (showLoading) {
        state.members.loading = true;
      }

      return state;
    }
  ),
  on(
    workspaceDetailApiActions.initWorkspacePeopleSuccess,
    (state, { members, nonMembers, invitations }): WorkspaceDetailState => {
      state.members.membersList = members.members;
      state.members.total = members.totalMembers;
      state.members.offset = members.offset;
      state.nonMembers.membersList = nonMembers.members;
      state.nonMembers.total = nonMembers.totalMembers;
      state.nonMembers.offset = nonMembers.offset;
      state.invitations.membersList = invitations.members;
      state.invitations.total = invitations.totalMembers;
      state.invitations.offset = invitations.offset;
      state.members.loading = false;
      state.nonMembers.loading = false;
      state.invitations.loading = false;

      return state;
    }
  ),
  on(
    workspaceDetailApiActions.getWorkspaceMembersSuccess,
    (state, { members, totalMembers, offset }): WorkspaceDetailState => {
      state.members.membersList = members;
      state.members.total = totalMembers;
      state.members.offset = offset;
      state.members.loading = false;

      return state;
    }
  ),
  on(
    workspaceDetailApiActions.removeMemberSuccess,
    (state, { member }): WorkspaceDetailState => {
      state.members.membersList = state.members.membersList.filter(
        (currentMember) => {
          return currentMember.user.username !== member;
        }
      );
      state.members.total = state.members.total - 1;

      return state;
    }
  ),
  on(
    workspaceDetailApiActions.initWorkspacePeople,
    workspaceDetailApiActions.getWorkspaceNonMembers,
    (state): WorkspaceDetailState => {
      state.nonMembers.loading = true;

      return state;
    }
  ),
  on(
    workspaceDetailApiActions.getWorkspaceNonMembersSuccess,
    (state, { members, totalMembers, offset }): WorkspaceDetailState => {
      state.nonMembers.membersList = members;
      state.nonMembers.total = totalMembers;
      state.nonMembers.offset = offset;
      state.nonMembers.loading = false;

      return state;
    }
  ),
  on(
    workspaceDetailApiActions.getWorkspaceMemberInvitationsSuccess,
    (state, { members, totalMembers, offset }): WorkspaceDetailState => {
      state.invitations.membersList = members;
      state.invitations.total = totalMembers;
      state.invitations.offset = offset;
      state.invitations.loading = false;

      return state;
    }
  ),
  on(
    workspaceDetailEventActions.removeMember,
    (state, { username }): WorkspaceDetailState => {
      const member = state.members.membersList.find((member) => {
        return member.user.username !== username;
      });

      if (member) {
        state.members.membersList = state.members.membersList.filter(
          (member) => {
            return member.user.username !== username;
          }
        );

        state.members.total--;
      }

      return state;
    }
  )
);

export const workspaceDetailFeature = createFeature({
  name: 'workspaceDetail',
  reducer: reducer,
});
