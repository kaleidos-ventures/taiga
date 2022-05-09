/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { UsersApiService } from '@taiga/api';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ResetPasswordGuard implements CanActivate {
  constructor(
    private userApiService: UsersApiService,
    private router: Router
  ) {}

  public canActivate(route: ActivatedRouteSnapshot) {
    return this.userApiService
      .verifyResetPassword(route.params.token as string)
      .pipe(
        map(() => {
          return true;
        }),
        catchError(() => {
          return of(
            this.router.createUrlTree([
              '/reset-password',
              { expiredToken: true },
            ])
          );
        })
      );
  }
}
