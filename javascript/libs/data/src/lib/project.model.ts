/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import type { Merge } from 'type-fest';
import { Membership } from './membership.model';
import { Milestone } from './milestone.model';
import { Story } from './story.model';
import { Workspace } from './workspace.model';

export interface Project {
  id: string;
  logoSmall: string;
  logoLarge: string;
  logo: string;
  name: string;
  slug: string;
  description: string | null;
  color: number;
  workspace: Pick<
    Workspace,
    'id' | 'name' | 'slug' | 'color' | 'isPremium' | 'userRole'
  >;
  milestones: Milestone[];
  userIsAdmin: boolean;
  userIsMember: boolean;
  userPermissions: string[];
  userHasPendingInvitation: boolean;
}

export interface ProjectCreation {
  workspaceId: Workspace['id'];
  name: string;
  description?: string;
  color: number;
  logo?: File;
}

export type EditProject = Merge<
  Pick<Project, 'id' | 'name' | 'logo' | 'description'>,
  { logo?: File }
>;
export interface StoryAssignEvent {
  storyAssignment: {
    story: Story;
    user: Membership['user'];
  };
}
