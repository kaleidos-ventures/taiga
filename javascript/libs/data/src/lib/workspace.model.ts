/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Project } from './project.model';

export type WorkspaceProject = Pick<
  Project,
  'name' | 'slug' | 'description' | 'color' | 'logoSmall'
>;

export type WorkspaceRole = 'admin' | 'member' | 'guest' | 'none';

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  color: number;
  latestProjects: WorkspaceProject[];
  invitedProjects: WorkspaceProject[];
  totalProjects: number;
  hasProjects: boolean;
  userRole: WorkspaceRole;
  isPremium: boolean;
  userIsOwner: boolean;
}

export interface WorkspaceCreation {
  name: string;
  color: number;
}

export interface WorkspaceDetail {
  workspace: Workspace;
  workspaceProject: Project[];
}
