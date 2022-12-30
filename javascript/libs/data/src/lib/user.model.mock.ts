/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  rand,
  randAvatar,
  randBoolean,
  randEmail,
  randFirstName,
  randJobArea,
  randLocale,
  randNumber,
  randParagraph,
  randPastDate,
  randUserName,
  randUuid,
} from '@ngneat/falso';

import { User } from './user.model';

export const UserMockFactory = (): User => {
  return {
    acceptedTerms: randBoolean(),
    bigPhoto: randAvatar(),
    bio: randParagraph({ length: 3 }).join('\n'),
    color: rand([1, 2, 3, 4, 5, 7, 8]),
    dateJoined: randPastDate().toDateString(),
    email: randEmail(),
    fullName: randFirstName(),
    gravatarId: randUuid(),
    id: randNumber(),
    isActive: randBoolean(),
    lang: randLocale(),
    maxMembershipsPrivateProjects: randNumber(),
    maxMembershipsPublicProjects: randNumber(),
    maxPrivateProjects: randNumber(),
    maxPublicProjects: randNumber(),
    photo: randAvatar(),
    readNewTerms: randBoolean(),
    roles: [randJobArea()],
    theme: 'taiga',
    timezone: '',
    totalPrivateProjects: randNumber(),
    totalPublicProjects: randNumber(),
    username: '@' + randUserName(),
    uuid: randUuid(),
  };
};
