/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import * as faker from 'faker';

import { User } from './user.model';

export const UserMockFactory = (): User => {
  return {
    acceptedTerms: faker.datatype.boolean(),
    bigPhoto: faker.image.avatar(),
    bio: faker.lorem.paragraphs(),
    color: faker.internet.color(),
    dateJoined: faker.date.past().toDateString(),
    email: faker.internet.email(),
    fullName: faker.name.firstName(),
    gravatarId: faker.datatype.uuid(),
    id: faker.datatype.number(),
    isActive: faker.datatype.boolean(),
    lang: faker.random.locale(),
    maxMembershipsPrivateProjects: faker.datatype.number(),
    maxMembershipsPublicProjects: faker.datatype.number(),
    maxPrivateProjects: faker.datatype.number(),
    maxPublicProjects: faker.datatype.number(),
    photo: faker.image.avatar(),
    readNewTerms: faker.datatype.boolean(),
    roles: [
      faker.name.jobArea(),
    ],
    theme: 'taiga',
    timezone: '',
    totalPrivateProjects: faker.datatype.number(),
    totalPublicProjects: faker.datatype.number(),
    username: faker.internet.userName(),
    uuid: faker.datatype.uuid(),
  };
};
