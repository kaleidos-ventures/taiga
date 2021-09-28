/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Workspace } from "./workspace.model";
import * as faker from 'faker';

export const WorkspaceMockFactory = (): Workspace => {
  return {
    id: faker.datatype.number(),
    slug: faker.datatype.string(),
    name: faker.datatype.string(),
    color: faker.datatype.number(),
  };
};