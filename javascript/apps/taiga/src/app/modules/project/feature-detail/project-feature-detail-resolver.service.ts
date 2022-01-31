/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { filterNil } from '~/app/shared/utils/operators';
import { fetchProject } from '../data-access/+state/actions/project.actions';
import { selectProject } from '../data-access/+state/selectors/project.selectors';

@Injectable({
  providedIn: 'root',
})
export class ProjectFeatureDetailResolverService {
  constructor(private readonly router: Router, private store: Store) {}

  public resolve(route: ActivatedRouteSnapshot) {
    const params = route.params as Record<string, string>;

    this.store.dispatch(fetchProject({ slug: params['slug'] }));

    return this.store
      .select(selectProject(params['slug']))
      .pipe(filterNil(), take(1));
  }
}
