/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, on } from '@ngrx/store';
import { Role } from '@taiga/data';
import { createImmerReducer } from '~/app/shared/utils/store';
import * as ProjectActions from '../actions/roles-permissions.actions';

export const projectFeatureKey = 'project';

export interface ProjectState {
  memberRoles: Role[] | null;
  publicPermissions: string[] | null;
  workspacePermissions: string[] | null;
}

export const initialState: ProjectState = {
  memberRoles: null,
  publicPermissions: null,
  workspacePermissions: null,
};

export const reducer = createImmerReducer(
  initialState,
  on(
    ProjectActions.fetchMemberRolesSuccess,
    (state, { roles }): ProjectState => {
      state.memberRoles = roles;

      return state;
    }
  ),
  on(
    ProjectActions.fetchPublicPermissionsSuccess,
    ProjectActions.updatePublicPermissionsSuccess,
    (state, { permissions: publicPermissions }): ProjectState => {
      state.publicPermissions = publicPermissions;

      return state;
    }
  ),
  on(ProjectActions.resetPermissions, (state): ProjectState => {
    state.memberRoles = null;
    state.publicPermissions = null;
    state.workspacePermissions = null;

    return state;
  }),
  on(
    ProjectActions.updateRolePermissionsSuccess,
    (state, { role }): ProjectState => {
      const memberRoles = state.memberRoles ?? [];

      state.memberRoles = memberRoles.map((currentRole) => {
        if (currentRole.slug === role.slug) {
          return role;
        }

        return currentRole;
      });

      return state;
    }
  )
);

export const rolesPermissionsFeature = createFeature({
  name: 'rolesPermissions',
  reducer: reducer,
});
