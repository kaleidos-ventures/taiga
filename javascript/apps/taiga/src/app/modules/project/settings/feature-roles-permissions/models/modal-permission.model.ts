/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Module } from '@taiga/data';
import { ModulePermission } from '~/app/modules/project/settings/feature-roles-permissions/models/module-permission.model';

export type ModuleConflictPermission = {
  name: string;
  conflicts?: Conflict[];
};

export type Conflict = {
  name: Module;
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
  onlyPublicPermission: ModulePermission[];
  public: ModulePermission[];
  member: ModulePermission[];
};
