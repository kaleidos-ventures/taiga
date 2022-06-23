/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Params,
  Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { GithubSignupInput } from '@taiga/data';
import { githubSignup } from '../data-access/+state/actions/auth.actions';

@Injectable({
  providedIn: 'root',
})
export class GithubSignupGuard implements CanActivate {
  constructor(private router: Router, private store: Store) {}

  public canActivate(route: ActivatedRouteSnapshot) {
    const queryParams: Params = route.queryParams;
    const redirect = (queryParams as GithubSignupInput).redirect;
    const code = (queryParams as GithubSignupInput).code;
    this.store.dispatch(githubSignup({ code, redirect }));
    return true;
  }
}
