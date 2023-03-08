/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { socialSignup } from '../data-access/+state/actions/auth.actions';
import { Store } from '@ngrx/store';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Params } from '@angular/router';
import { SocialSignupInput } from '@taiga/data';

export const SocialSignupGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const store = inject(Store);

  const queryParams: Params = route.queryParams;
  const code = (queryParams as SocialSignupInput).code;
  const qs = (queryParams as SocialSignupInput).state || '';
  const decodedParams = decodeURIComponent(qs);
  const urlParams = new URLSearchParams(decodedParams);
  const social = urlParams.get('social')!;
  const redirect = urlParams.get('redirect')!;
  const projectInvitationToken = urlParams.get('projectInvitationToken') || '';
  const acceptProjectInvitation =
    urlParams.get('acceptProjectInvitation') === 'true' || false;

  requestAnimationFrame(() => {
    store.dispatch(
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
};
