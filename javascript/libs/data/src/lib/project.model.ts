/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Milestone } from './milestone.model';
import { Workspace } from './workspace.model';

export interface Project {
  id: number;
  slug: string;
  milestones: Milestone[];
  name: string;
  description: string;
  color: number
}

export interface ProjectCreation {
  workspaceSlug: Workspace['slug'];
  title: string;
  description: string;
  color: number;
  icon?: File;
}
