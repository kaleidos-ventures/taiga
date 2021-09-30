/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { User, Workspace } from '@taiga/data';

export const setWorkspaceList = createAction(
  '[WorkspaceList] set',
  props<{workspaces: Workspace[]}>()
);

export const getWorkspaceList = createAction(
  '[WorkspaceList] Get',
  props<{id: User['id']}>()
);

export const addWorkspace = createAction(
  '[Workspace] Add workspace',
  props<{name: Workspace['name'], color: Workspace['color'], userId: User['id']}>()
);
