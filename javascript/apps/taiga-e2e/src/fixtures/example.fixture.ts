/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import {
  randFirstName,
  randEmail,
  randPassword,
  randSentence,
  random,
} from '@ngneat/falso';

random('6443');

export const exampleFixture = {
  name: randFirstName(),
  email: randEmail(),
  password: randPassword(),
  userStorySubject: randSentence(),
};
