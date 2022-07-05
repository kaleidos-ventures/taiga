/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Params } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SocialSignupInput } from '@taiga/data';
import { take, map } from 'rxjs/operators';

import {
  socialSignup,
  signUpSuccess,
} from '../data-access/+state/actions/auth.actions';
@Injectable({
  providedIn: 'root',
})
export class SocialSignupGuard implements CanActivate {
  constructor(private store: Store, private actions$: Actions) {}

  public canActivate(route: ActivatedRouteSnapshot) {
    const queryParams: Params = route.queryParams;
    const code = (queryParams as SocialSignupInput).code;
    const qs = (queryParams as SocialSignupInput).state || '';
    const decodedParams = decodeURIComponent(qs);
    const urlParams = new URLSearchParams(decodedParams);
    const social = urlParams.get('social')!;
    const redirect = urlParams.get('redirect')!;
    this.store.dispatch(socialSignup({ code, redirect, social }));
    return this.actions$.pipe(
      ofType(signUpSuccess),
      take(1),
      map(() => true)
    );
  }
}
