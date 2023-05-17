/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Project } from './project.model';
import { User } from './user.model';
import { InvitationInfo } from './invitation.model';

export type WorkspaceProject = Pick<
  Project,
  'id' | 'name' | 'slug' | 'description' | 'color' | 'logoSmall'
>;

export type WorkspaceRole = 'admin' | 'member' | 'guest' | 'none';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  color: number;
  latestProjects: WorkspaceProject[];
  invitedProjects: WorkspaceProject[];
  totalProjects: number;
  hasProjects: boolean;
  userRole: WorkspaceRole;
}

export interface WorkspaceCreation {
  name: string;
  color: number;
}

export interface WorkspaceDetail {
  workspace: Workspace;
  workspaceProject: Project[];
}

export interface WorkspaceMembership {
  user: Pick<User, 'username' | 'fullName' | 'color'>;
  workspace: Pick<WorkspaceProject, 'id' | 'name' | 'slug'>;
  role: string;
  projects: Pick<
    Project,
    | 'id'
    | 'logoSmall'
    | 'logoLarge'
    | 'logo'
    | 'name'
    | 'slug'
    | 'description'
    | 'color'
  >[];
}

export interface InvitationWorkspaceMember {
  user: Pick<User, 'username' | 'fullName' | 'color'>;
  workspace: {
    id: string;
    name?: string;
    slug?: string;
  };
  email: string;
}

export interface InvitationWorkspaceInfo extends InvitationInfo {
  workspace: Pick<WorkspaceProject, 'id' | 'name' | 'slug'>;
}
