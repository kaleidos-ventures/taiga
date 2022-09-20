/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export enum Permissions {
  // Epic
  viewEpics = 'view_epics',
  addEpic = 'add_epic',
  modifyEpic = 'modify_epic',
  commentEpic = 'comment_epic',
  deleteEpic = 'delete_epic',
  // Milestone
  viewMilestones = 'view_milestones',
  addMilestone = 'add_milestone',
  modifyMilestone = 'modify_milestone',
  deleteMilestone = 'delete_milestone',
  // User Story
  viewStory = 'view_story',
  addStory = 'add_story',
  modifyStory = 'modify_story',
  commentStory = 'comment_story',
  deleteStory = 'delete_story',
  // Task
  viewTask = 'view_task',
  addTask = 'add_task',
  commentTask = 'comment_task',
  modifyTask = 'modify_task',
  deleteTask = 'delete_task',
  // Issue
  viewIssues = 'view_issues',
  addIssue = 'add_issue',
  commentIssue = 'comment_issue',
  modifyIssue = 'modify_issue',
  deleteIsue = 'delete_issue',
  // Wiki Link
  viewWikiLinks = 'view_wiki_links',
  addWikiLink = 'add_wiki_link',
  modifyWikiLink = 'modify_wiki_link',
  deleteWikiLink = 'delete_wiki_link',
  // Wiki Page
  viewWikiPages = 'view_wiki_pages',
  addWikiPage = 'add_wiki_page',
  modifyWikiPage = 'modify_wiki_page',
  commentWikiPage = 'comment_wiki_page',
  deleteWikiPage = 'delete_wiki_page',
  // Project
  modifyProject = 'modify_project',
  adminProjectValues = 'admin_project_values',
  deleteProject = 'delete_project',
  addMember = 'add_member',
  removeMember = 'remove_member',
  adminRoles = 'admin_roles',
}

export interface Role {
  // readonly id: number;
  name: string;
  slug: string;
  order: number;
  isAdmin: boolean;
  permissions: Permissions[];
  numMembers: number;
}
