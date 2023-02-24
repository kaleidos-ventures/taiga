/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  randBoolean,
  randNumber,
  randDomainSuffix,
  randSequence,
  randWord,
} from '@ngneat/falso';
import { Milestone } from './milestone.model';

export const MilestoneMockFactory = (): Milestone => {
  return {
    closed: randBoolean(),
    closedPoints: randNumber(),
    createdDate: randSequence(),
    disponibility: randNumber(),
    estimatedFinish: randSequence(),
    estimatedStart: randSequence(),
    id: randNumber(),
    modifiedDate: randSequence(),
    name: randWord(),
    order: randNumber(),
    projectExtraInfo: [],
    slug: randDomainSuffix({ length: 3 }).join('-'),
    totalPoints: randNumber(),
  };
};
