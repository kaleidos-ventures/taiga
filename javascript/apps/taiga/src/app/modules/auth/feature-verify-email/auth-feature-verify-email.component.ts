/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { resendVerifyEmail } from './+state/actions/auth-feature-verify-email.actions';

@Component({
  selector: 'tg-verify-email',
  templateUrl: './auth-feature-verify-email.component.html',
  styleUrls: ['./auth-feature-verify-email.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFeatureVerifyEmailComponent implements OnInit {
  public emailAddress = '';

  constructor(private store: Store, private route: ActivatedRoute) {}

  public ngOnInit(): void {
    this.emailAddress = this.route.snapshot.queryParams.email as string;
  }

  public resendEmail() {
    this.store.dispatch(resendVerifyEmail());
  }
}
