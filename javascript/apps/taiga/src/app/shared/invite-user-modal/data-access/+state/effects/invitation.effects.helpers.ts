/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Contact, User } from '@taiga/data';

export function getSuggestedInvitationsList(
  suggestedUsers: Contact[],
  peopleAddedMatch: Contact[],
  peopleAddedUsernameList: string[],
  user: User
): Contact[] {
  let suggestedList = suggestedUsers.filter(
    (suggestedUser) =>
      suggestedUser.username !== user.username &&
      !peopleAddedUsernameList.includes(suggestedUser.username) &&
      !suggestedUser.userIsMember
  );
  const alreadyMembers = suggestedUsers.filter(
    (suggestedUser) =>
      suggestedUser.username !== user.username && suggestedUser.userIsMember
  );
  suggestedList = [
    ...alreadyMembers,
    ...peopleAddedMatch,
    ...suggestedList,
  ].slice(0, 6);

  return suggestedList;
}
