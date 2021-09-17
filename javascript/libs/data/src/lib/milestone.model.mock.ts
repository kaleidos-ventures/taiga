/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import * as faker from 'faker';
import { Milestone } from './milestone.model';

export const MilestoneMockFactory = (): Milestone => {
  return {
    closed: faker.datatype.boolean(),
    closedPoints: faker.datatype.number(),
    createdDate: faker.datatype.string(),
    disponibility: faker.datatype.number(),
    estimatedFinish: faker.datatype.string(),
    estimatedStart: faker.datatype.string(),
    id: faker.datatype.number(),
    modifiedDate: faker.datatype.string(),
    name: faker.datatype.string(),
    order: faker.datatype.number(),
    projectExtraInfo: [],
    slug: faker.datatype.string(),
    totalPoints: faker.datatype.number()
  };
};
