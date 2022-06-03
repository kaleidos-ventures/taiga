/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Invitation } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class InvitationService {
  public positionInvitationInArray(
    invitations: Invitation[],
    newInvitation: Invitation
  ): number {
    const usersArrayOrdered = [
      ...this.getFilteredUsers(invitations, newInvitation, true),
      ...this.getFilteredUsers(invitations, newInvitation, false),
    ];
    return usersArrayOrdered.findIndex((it) => {
      return newInvitation.email
        ? it.email === newInvitation.email
        : it.user?.username === newInvitation.user?.username;
    });
  }

  public getFilteredUsers(
    invitations: Invitation[],
    newInvitation: Invitation,
    registered: boolean
  ): Invitation[] {
    const newUsersArray = invitations.slice();
    newUsersArray.push(newInvitation);
    const filteredArray = registered
      ? newUsersArray.filter((it) => it.user?.fullName)
      : newUsersArray.filter((it) => !it.user);
    return filteredArray?.slice().sort((a, b) => {
      const firstValue = (registered ? a.user?.fullName : a.email) || '';
      const secondValue = (registered ? b.user?.fullName : b.email) || '';
      return firstValue.localeCompare(secondValue);
    });
  }
}
