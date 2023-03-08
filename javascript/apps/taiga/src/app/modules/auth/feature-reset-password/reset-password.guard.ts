/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UsersApiService } from '@taiga/api';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const ResetPasswordGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const userApiService = inject(UsersApiService);
  const router = inject(Router);

  return userApiService.verifyResetPassword(route.params.token as string).pipe(
    map(() => {
      return true;
    }),
    catchError(() => {
      return of(
        router.createUrlTree(['/reset-password', { expiredToken: true }])
      );
    })
  );
};
