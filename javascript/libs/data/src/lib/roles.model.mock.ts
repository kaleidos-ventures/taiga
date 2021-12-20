/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Role, Permissions } from './roles.model';
import * as faker from 'faker';

export const RoleMockFactory = (): Role => {
  const role: Role = {
    name: faker.name.title(),
    slug: faker.datatype.string(),
    order: faker.datatype.number(),
    isAdmin: faker.datatype.boolean(),
    permissions: getPermissions(),
    numMembers: faker.datatype.number()
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

    Permissions.viewTasks,
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

    Permissions.viewProject,
    Permissions.modifyProject,
    Permissions.adminProjectValues,
    Permissions.deleteProject,
    Permissions.addMember,
    Permissions.removeMember,
    Permissions.adminRoles,
  ];
  return permissions.filter((permission, index) => index % faker.datatype.number() === 0);
};
