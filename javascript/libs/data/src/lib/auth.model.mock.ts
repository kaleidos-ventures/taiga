/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import * as faker from 'faker';

import { Auth } from './auth.model';

export const AuthMockFactory = (): Auth => {
  return {
    refresh: faker.datatype.uuid(),
    token: faker.datatype.uuid(),
  };
};
