/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { ProjectApiService } from '@taiga/api';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectFeatureShellResolverService {
  constructor(
    private projectApiService: ProjectApiService,
    private revokeInvitationService: RevokeInvitationService,
    private router: Router
  ) {}

  public resolve(route: ActivatedRouteSnapshot) {
    const params = route.params as Record<string, string>;

    return this.projectApiService.getProject(params['id']).pipe(
      catchError((httpResponse: HttpErrorResponse) => {
        this.revokeInvitationService.shellResolverRevokeError(httpResponse);

        if (httpResponse.status === 422) {
          void this.router.navigate(['/not-found']);
        }

        return of(null);
      })
    );
  }
}
