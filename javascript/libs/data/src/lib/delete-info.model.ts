/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Project } from './project.model';
import { Workspace } from './workspace.model';

type DeleteInfoWorkspaces = Pick<
  Workspace,
  'id' | 'name' | 'slug' | 'color'
> & { projects: Project[] };

export interface DeleteInfo {
  workspaces: DeleteInfoWorkspaces[];
  projects: Project[];
}
