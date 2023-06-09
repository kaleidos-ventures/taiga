/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Workflow } from './workflow.model';

export interface Status {
  id?: string;
  name: string;
  slug: string;
  color: number;
  order?: number;
}

export interface WorkflowStatus extends Status {
  workflow: Pick<Workflow, 'name' | 'slug'>;
}
