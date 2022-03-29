/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '~/app/modules/auth/data-access/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFeatureLoginGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  public canActivate(): true | UrlTree {
    if (this.authService.isLogged()) {
      return this.router.parseUrl('/');
    }

    return true;
  }
}
