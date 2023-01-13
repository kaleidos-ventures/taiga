/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { InvitationService } from './invitation.service';

describe('InvitationService', () => {
  let spectator: SpectatorService<InvitationService>;

  const createService = createServiceFactory({
    service: InvitationService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('get position to add new registered user invitation on invitation list', () => {
    const invitations = [
      {
        email: 'user2@taiga.demo',
        user: {
          username: 'user2',
          fullName: 'Jorge Sullivan',
          color: 1,
        },
        role: { isAdmin: false, name: 'General', slug: 'general' },
      },
      {
        role: { isAdmin: false, name: 'General', slug: 'general' },
        email: 'test@test.es',
      },
    ];
    const newInvitation = {
      user: { username: 'user3', fullName: 'Jorge Sullivan', color: 2 },
      role: { isAdmin: false, name: 'General', slug: 'general' },
      email: 'user3@taiga.demo',
    };
    const index = spectator.service.positionInvitationInArray(
      invitations,
      newInvitation
    );
    expect(index).toEqual(1);
  });

  it('get position to add new non registered user invitation on invitation list', () => {
    const invitations = [
      {
        email: 'user2@taiga.demo',
        user: {
          username: 'user2',
          fullName: 'Jorge Sullivan',
          color: 1,
        },
        role: { isAdmin: false, name: 'General', slug: 'general' },
      },
      {
        email: 'user3@taiga.demo',
        user: {
          username: 'user3',
          fullName: 'Jorge Sullivan',
          color: 2,
        },
        role: { isAdmin: false, name: 'General', slug: 'general' },
      },
      {
        role: { isAdmin: false, name: 'General', slug: 'general' },
        email: 'test@test.es',
      },
    ];
    const newInvitation = {
      email: 'atest@test.es',
      role: { isAdmin: false, name: 'General', slug: 'general' },
    };
    const index = spectator.service.positionInvitationInArray(
      invitations,
      newInvitation
    );
    expect(index).toEqual(2);
  });

  it('get users that match name or username with the introduced text', () => {
    const user1 = {
      username: 'jablonki',
      fullName: 'Jabłoński Černý',
      color: 1,
    };
    const user2 = {
      username: 'doroic',
      fullName: 'Ðorðić Æbeltoft',
      color: 2,
    };
    const usersList = [user1, user2];
    const text = user1.username.substring(0, 2);
    const usersMatch = spectator.service.matchUsersFromList(usersList, text);
    expect(usersMatch).toEqual([user1]);
  });
});
