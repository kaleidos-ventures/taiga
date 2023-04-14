/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createAction, props } from '@ngrx/store';
import { Project, ProjectCreation } from '@taiga/data';

export const createProject = createAction(
  '[NewProject] create project',
  props<{ project: ProjectCreation }>()
);

export const createProjectSuccess = createAction(
  '[NewProject] create project success',
  props<{ project: Project }>()
);

export const createProjectError = createAction(
  '[NewProject] create project error',
  props<{ error: unknown }>()
);
