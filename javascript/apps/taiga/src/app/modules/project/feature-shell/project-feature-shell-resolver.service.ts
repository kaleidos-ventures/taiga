/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { AppService } from '~/app/services/app.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectFeatureShellResolverService {
  constructor(
    private store: Store,
    private appService: AppService,
    private projectApiService: ProjectApiService,
    private router: Router
  ) {}

  public resolve(route: ActivatedRouteSnapshot) {
    const params = route.params as Record<string, string>;

    return this.projectApiService.getProject(params['slug']).pipe(
      tap((project) => {
        this.store.dispatch(ProjectActions.fetchProjectSuccess({ project }));
      }),
      catchError((httpResponse: HttpErrorResponse) => {
        requestAnimationFrame(() => {
          const status = window.history.state as { invite: string } | undefined;
          if (status?.invite === 'revoked') {
            this.appService.toastNotification({
              message: 'errors.no_permission_to_see',
              status: TuiNotification.Error,
              autoClose: false,
              closeOnNavigation: false,
            });
            void this.router.navigate(['/']);
          } else {
            this.appService.errorManagement(httpResponse);
          }
        });

        return of(null);
      })
    );
  }
}
