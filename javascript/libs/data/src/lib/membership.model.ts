/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Permissions } from './roles.model';
import { User } from './user.model';

export interface Membership {
  id?: string;
  user: Pick<User, 'username' | 'fullName' | 'color'>;
  role: {
    isAdmin: boolean;
    name?: string;
    slug?: string;
    permissions?: Permissions[];
  };
}
