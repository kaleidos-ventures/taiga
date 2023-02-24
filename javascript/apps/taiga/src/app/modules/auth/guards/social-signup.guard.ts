/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Params } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SocialSignupInput } from '@taiga/data';

import { socialSignup } from '../data-access/+state/actions/auth.actions';
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
    const projectInvitationToken =
      urlParams.get('projectInvitationToken') || '';
    const acceptProjectInvitation =
      urlParams.get('acceptProjectInvitation') === 'true' || false;

    requestAnimationFrame(() => {
      this.store.dispatch(
        socialSignup({
          code,
          redirect,
          social,
          projectInvitationToken,
          acceptProjectInvitation,
        })
      );
    });
    return true;
  }
}
