/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Project, Workspace } from '@taiga/data';

export const fetchWorkspace = createAction(
  '[Workspace] Fetch',
  props<{ slug: Workspace['slug'] }>()
);

export const fetchWorkspaceSuccess = createAction(
  '[Workspace] Fetch Success',
  props<{ workspace: Workspace }>()
);

export const fetchWorkspaceProjectsSuccess = createAction(
  '[Workspace] Fetch Projects Success',
  props<{ projects: Project[] }>()
);

export const resetWorkspace = createAction('[Workspace] Reset workspace');
