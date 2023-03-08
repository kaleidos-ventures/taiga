/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { inject } from '@angular/core';
import { Router, ResolveFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, of } from 'rxjs';
import { UtilsService } from '~/app/shared/utils/utils-service.service';
import { selectCurrentProject } from '../data-access/+state/selectors/project.selectors';

export const ProjectAdminResolver: ResolveFn<Observable<unknown>> = () => {
  const store = inject(Store) as Store<object>;
  const router = inject(Router);

  const project = UtilsService.getState(store, selectCurrentProject);

  if (!project?.userIsAdmin) {
    void router.navigate(['/']);
    return EMPTY;
  }

  return of(null);
};
