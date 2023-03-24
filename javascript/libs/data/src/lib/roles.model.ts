/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export enum Permissions {
  // User Story
  viewStory = 'view_story',
  addStory = 'add_story',
  modifyStory = 'modify_story',
  commentStory = 'comment_story',
  deleteStory = 'delete_story',
  // Project
  modifyProject = 'modify_project',
  adminProjectValues = 'admin_project_values',
  deleteProject = 'delete_project',
  addMember = 'add_member',
  removeMember = 'remove_member',
  adminRoles = 'admin_roles',
}

export interface Role {
  name: string;
  slug: string;
  order: number;
  isAdmin: boolean;
  permissions: Permissions[];
  numMembers: number;
}
