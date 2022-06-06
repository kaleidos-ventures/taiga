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
        user: {
          username: 'user2',
          fullName: 'Jorge Sullivan',
        },
        role: { isAdmin: false, name: 'General', slug: 'general' },
      },
      {
        role: { isAdmin: false, name: 'General', slug: 'general' },
        email: 'test@test.es',
      },
    ];
    const newInvitation = {
      user: { username: 'user3', fullName: 'Jorge Sullivan' },
      role: { isAdmin: false, name: 'General', slug: 'general' },
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
        user: {
          username: 'user2',
          fullName: 'Jorge Sullivan',
        },
        role: { isAdmin: false, name: 'General', slug: 'general' },
      },
      {
        user: {
          username: 'user3',
          fullName: 'Jorge Sullivan',
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
});
