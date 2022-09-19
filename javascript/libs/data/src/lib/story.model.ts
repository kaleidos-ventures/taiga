/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Project } from './project.model';
import { Status } from './status.model';
import { Workflow } from './workflow.model';

export interface Story {
  reference: number;
  name: string;
  slug: string;
  order: number;
  workflow: Workflow['slug'];
  status: Status['slug'];
  project: Project['slug'];
}
