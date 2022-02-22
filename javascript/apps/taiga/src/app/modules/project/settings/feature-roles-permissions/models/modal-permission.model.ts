/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Entity, EntityPermission } from '@taiga/data';

export type EntityConflictPermission = {
  name: string;
  conflicts?: Conflict[];
};

export type Conflict = {
  name: Entity;
  permission: PermissionConflict;
  texts: TextConflict;
};

export type TextConflict = {
  public: {
    text: string[];
    restrictions?: string[];
  };
  member: {
    text: string[];
    restrictions?: string[];
  };
};

export type PermissionConflict = {
  onlyPublicPermission: EntityPermission[];
  public: EntityPermission[];
  member: EntityPermission[];
};
