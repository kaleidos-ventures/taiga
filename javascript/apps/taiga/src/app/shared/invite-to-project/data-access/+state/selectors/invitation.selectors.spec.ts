/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  selectMemberRolesOrdered,
  selectUsersToInvite,
} from './invitation.selectors';

describe('invite selectors', () => {
  it('member roles ordered', () => {
    const roles = [
      {
        id: '120',
        isAdmin: false,
        name: 'General',
        numMembers: 1,
        order: 2,
        permissions: [
          'add_us',
          'comment_us',
          'delete_us',
          'modify_us',
          'view_us',
        ],
        slug: 'general',
      },
      {
        id: '123',
        isAdmin: true,
        name: 'Administrator',
        numMembers: 1,
        order: 1,
        permissions: [
          'add_us',
          'comment_us',
          'delete_us',
          'modify_us',
          'view_us',
          'add_task',
          'comment_task',
          'delete_task',
          'modify_task',
          'view_task',
        ],
        slug: 'admin',
      },
    ];
    const membersRoles = selectMemberRolesOrdered.projector(roles);
    expect(membersRoles).toEqual([
      {
        id: '123',
        isAdmin: true,
        name: 'Administrator',
        numMembers: 1,
        order: 1,
        permissions: [
          'add_us',
          'comment_us',
          'delete_us',
          'modify_us',
          'view_us',
          'add_task',
          'comment_task',
          'delete_task',
          'modify_task',
          'view_task',
        ],
        slug: 'admin',
      },
      {
        id: '120',
        isAdmin: false,
        name: 'General',
        numMembers: 1,
        order: 2,
        permissions: [
          'add_us',
          'comment_us',
          'delete_us',
          'modify_us',
          'view_us',
        ],
        slug: 'general',
      },
    ]);
  });

  it('users to invite', () => {
    const userIdentifier = ['user1', 'test2@test.com'];
    const rolesOrdered = [
      {
        id: '123',
        isAdmin: true,
        name: 'Administrator',
        numMembers: 1,
        order: 1,
        permissions: [
          'add_us',
          'comment_us',
          'delete_us',
          'modify_us',
          'view_us',
          'add_task',
          'comment_task',
          'delete_task',
          'modify_task',
          'view_task',
        ],
        slug: 'admin',
      },
      {
        id: '120',
        isAdmin: false,
        name: 'General',
        numMembers: 1,
        order: 2,
        permissions: [
          'add_us',
          'comment_us',
          'delete_us',
          'modify_us',
          'view_us',
        ],
        slug: 'general',
      },
    ];
    const contacts = [
      {
        username: 'user1',
        fullName: 'user one',
      },
    ];
    const userToInvite = selectUsersToInvite(userIdentifier).projector(
      rolesOrdered,
      contacts
    );
    expect(userToInvite).toEqual([
      {
        username: 'user1',
        fullName: 'user one',
        roles: ['General'],
      },
      {
        email: 'test2@test.com',
        roles: ['General'],
      },
    ]);
  });
});
