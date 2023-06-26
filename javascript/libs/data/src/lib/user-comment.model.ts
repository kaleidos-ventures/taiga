/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { User } from './user.model';

export interface UserComment {
  id: string;
  text: string;
  createdAt: string;
  createdBy: {
    username: string;
    fullName: string;
    color: number;
  };
  deletedBy?: Partial<User>;
  deletedAt?: string;
}
