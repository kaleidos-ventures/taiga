/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randParagraph, randPastDate } from '@ngneat/falso';
import { UserComment } from './user-comment.model';
import { UserMockFactory } from './user.model.mock';

export const UserCommentMockFactory = (): UserComment => {
  const user = UserMockFactory();

  return {
    text: randParagraph(),
    createdAt: randPastDate().toISOString(),
    createdBy: {
      username: user.username,
      fullName: user.fullName,
      color: user.color,
    },
  };
};
