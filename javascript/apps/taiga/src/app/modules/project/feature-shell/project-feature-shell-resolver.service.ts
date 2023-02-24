/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { ProjectApiService } from '@taiga/api';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectFeatureShellResolverService {
  constructor(
    private store: Store,
    private projectApiService: ProjectApiService,
    private revokeInvitationService: RevokeInvitationService
  ) {}

  public resolve(route: ActivatedRouteSnapshot) {
    const params = route.params as Record<string, string>;

    return this.projectApiService.getProject(params['id']).pipe(
      tap((project) => {
        this.store.dispatch(ProjectActions.fetchProjectSuccess({ project }));
      }),
      catchError((httpResponse: HttpErrorResponse) => {
        this.revokeInvitationService.shellResolverRevokeError(httpResponse);

        return of(null);
      })
    );
  }
}
