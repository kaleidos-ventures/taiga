/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Workspace } from '@taiga/data';

export const setWorkspace = createAction(
  '[Workspace] Set',
  props<{workspace: Workspace}>()
);

export const getWorkspace = createAction(
  '[Workspace] Get',
  props<{id: Workspace['id']}>()
);
