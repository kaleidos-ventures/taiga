/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randSlug, randWord } from '@ngneat/falso';
import { StatusMockFactory } from './status.model.mock';
import { Workflow } from './workflow.model';

export const WorkflowMockFactory = (numStatuses = 10): Workflow => {
  return {
    name: randWord(),
    slug: randSlug(),
    statuses: Array.from({ length: numStatuses }, () => StatusMockFactory()),
  };
};
