/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Router, Resolve } from '@angular/router';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, of } from 'rxjs';
import { UtilsService } from '~/app/shared/utils/utils-service.service';
import { selectCurrentProject } from '../data-access/+state/selectors/project.selectors';

@Injectable({
  providedIn: 'root',
})
export class ProjectAdminResolver implements Resolve<Observable<unknown>> {
  constructor(private store: Store, private router: Router) {}

  public resolve() {
    const project = UtilsService.getState(this.store, selectCurrentProject);

    if (!project?.userIsAdmin) {
      void this.router.navigate(['/']);
      return EMPTY;
    }

    return of(null);
  }
}
