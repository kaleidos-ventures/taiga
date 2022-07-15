/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Role, Permissions } from './roles.model';
import {
  randDomainSuffix,
  randNumber,
  randBoolean,
  randWord,
} from '@ngneat/falso';

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
    Permissions.addEpic,
    Permissions.viewEpics,
    Permissions.modifyEpic,
    Permissions.commentEpic,
    Permissions.deleteEpic,

    Permissions.viewMilestones,
    Permissions.addMilestone,
    Permissions.modifyMilestone,
    Permissions.deleteMilestone,

    Permissions.viewUserstory,
    Permissions.addUserstory,
    Permissions.modifyUserstory,
    Permissions.commentUserstory,
    Permissions.deleteUserstory,

    Permissions.viewTask,
    Permissions.addTask,
    Permissions.commentTask,
    Permissions.modifyTask,
    Permissions.deleteTask,

    Permissions.viewIssues,
    Permissions.addIssue,
    Permissions.commentIssue,
    Permissions.modifyIssue,
    Permissions.deleteIsue,

    Permissions.viewWikiLinks,
    Permissions.addWikiLink,
    Permissions.modifyWikiLink,
    Permissions.deleteWikiLink,

    Permissions.viewWikiPages,
    Permissions.addWikiPage,
    Permissions.modifyWikiPage,
    Permissions.commentWikiPage,
    Permissions.deleteWikiPage,

    Permissions.modifyProject,
    Permissions.adminProjectValues,
    Permissions.deleteProject,
    Permissions.addMember,
    Permissions.removeMember,
    Permissions.adminRoles,
  ];
  return permissions.filter((permission, index) => index % randNumber() === 0);
};
