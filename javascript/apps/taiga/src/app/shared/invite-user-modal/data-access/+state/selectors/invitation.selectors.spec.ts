/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Contact, Permissions, Role } from '@taiga/data';
import {
  selectMemberRolesOrdered,
  selectProjectUsersToInvite,
  selectWorkspaceUsersToInvite,
} from './invitation.selectors';

export const rolesOrdered: Role[] = [
  {
    isAdmin: true,
    name: 'Administrator',
    numMembers: 1,
    order: 1,
    permissions: [
      'add_story',
      'comment_story',
      'delete_story',
      'modify_story',
      'view_story',
    ] as Permissions[],
    slug: 'admin',
  },
  {
    isAdmin: false,
    name: 'General',
    numMembers: 1,
    order: 2,
    permissions: [
      'add_story',
      'comment_story',
      'delete_story',
      'modify_story',
      'view_story',
    ] as Permissions[],
    slug: 'general',
  },
];

describe('invite selectors', () => {
  it('member roles ordered', () => {
    const roles: Role[] = [
      {
        isAdmin: false,
        name: 'General',
        numMembers: 1,
        order: 2,
        permissions: [
          'add_story',
          'comment_story',
          'delete_story',
          'modify_story',
          'view_story',
        ] as Permissions[],
        slug: 'general',
      },
      {
        isAdmin: true,
        name: 'Administrator',
        numMembers: 1,
        order: 1,
        permissions: [
          'add_story',
          'comment_story',
          'delete_story',
          'modify_story',
          'view_story',
        ] as Permissions[],
        slug: 'admin',
      },
    ];
    const membersRoles = selectMemberRolesOrdered.projector(roles);
    expect(membersRoles).toEqual([
      {
        isAdmin: true,
        name: 'Administrator',
        numMembers: 1,
        order: 1,
        permissions: [
          'add_story',
          'comment_story',
          'delete_story',
          'modify_story',
          'view_story',
        ],
        slug: 'admin',
      },
      {
        isAdmin: false,
        name: 'General',
        numMembers: 1,
        order: 2,
        permissions: [
          'add_story',
          'comment_story',
          'delete_story',
          'modify_story',
          'view_story',
        ],
        slug: 'general',
      },
    ]);
  });

  it('project: users to invite', () => {
    const userIdentifier = ['user1', 'test2@test.com'];
    const contacts: Contact[] = [
      {
        username: 'user1',
        fullName: 'user one',
      },
    ];
    const userToInvite = selectProjectUsersToInvite(userIdentifier).projector(
      rolesOrdered,
      contacts,
      []
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
        userHasPendingInvitation: false,
      },
    ]);
  });

  it('workspace: users to invite', () => {
    const userIdentifier = ['user1', 'test2@test.com'];
    const contacts: Contact[] = [
      {
        username: 'user1',
        fullName: 'user one',
      },
    ];
    const userToInvite = selectWorkspaceUsersToInvite(userIdentifier).projector(
      contacts,
      []
    );
    expect(userToInvite).toEqual([
      {
        username: 'user1',
        fullName: 'user one',
      },
      {
        email: 'test2@test.com',
        userHasPendingInvitation: false,
      },
    ]);
  });
});
