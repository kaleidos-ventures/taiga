/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import * as faker from 'faker';

faker.seed(6443);

export const exampleFixture = {
  name: faker.name.firstName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  userStorySubject: faker.lorem.sentence()
};