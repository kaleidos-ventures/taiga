/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randNumber, randSlug, randStatus, randUuid } from '@ngneat/falso';
import { Status } from './status.model';

export const StatusMockFactory = (): Status => {
  return {
    id: randUuid(),
    name: randStatus(),
    slug: randSlug(),
    color: randNumber({
      max: 2,
    }),
  };
};
