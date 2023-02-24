/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { rolesPermissionsFeature } from '../reducers/roles-permissions.reducer';

export const {
  selectMemberRoles,
  selectPublicPermissions,
  selectWorkspacePermissions,
} = rolesPermissionsFeature;
