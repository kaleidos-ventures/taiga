/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { ProjectApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';

@Injectable({
  providedIn: 'root',
})
export class ProjectFeatureDetailResolverService {
  constructor(
    private router: Router,
    private store: Store,
    private appService: AppService,
    private projectApiService: ProjectApiService
  ) {}

  public resolve(route: ActivatedRouteSnapshot) {
    const params = route.params as Record<string, string>;

    return this.projectApiService.getProject(params['slug']).pipe(
      filterNil(),
      tap((project) => {
        this.store.dispatch(ProjectActions.fetchProjectSuccess({ project }));
      }),
      catchError((httpResponse: HttpErrorResponse) => {
        requestAnimationFrame(() => {
          this.appService.errorManagement(httpResponse);
        });

        return of(null);
      })
    );
  }
}
