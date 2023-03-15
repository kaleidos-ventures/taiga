/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  randBoolean,
  randDomainSuffix,
  randNumber,
  randWord,
} from '@ngneat/falso';
import { Permissions, Role } from './roles.model';

export const RoleMockFactory = (): Role => {
  const role: Role = {
    name: randWord({ length: 3 }).join(' '),
    slug: randDomainSuffix({ length: 3 }).join('-'),
    order: randNumber(),
    isAdmin: randBoolean(),
    permissions: getPermissions(),
    numMembers: randNumber(),
  };

  return role;
};

const getPermissions = () => {
  const permissions: Permissions[] = [
    Permissions.viewStory,
    Permissions.addStory,
    Permissions.modifyStory,
    Permissions.commentStory,
    Permissions.deleteStory,

    Permissions.modifyProject,
    Permissions.adminProjectValues,
    Permissions.deleteProject,
    Permissions.addMember,
    Permissions.removeMember,
    Permissions.adminRoles,
  ];
  return permissions.filter((permission, index) => index % randNumber() === 0);
};
