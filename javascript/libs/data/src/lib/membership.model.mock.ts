/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { rand, randBoolean, randFirstName, randUserName } from '@ngneat/falso';
import { Membership } from './membership.model';

export const MembershipMockFactory = (): Membership => {
  return {
    user: {
      username: '@' + randUserName(),
      fullName: randFirstName(),
      color: rand([1, 2, 3, 4, 5, 7, 8]),
    },
    role: {
      isAdmin: randBoolean(),
    },
  };
};
