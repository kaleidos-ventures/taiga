/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tg-sign-up',
  templateUrl: './auth-feature-sign-up.component.html',
  styleUrls: [
    './auth-feature-sign-up.component.css',
    './styles/sign-up.shared.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFeatureSignUpComponent {
  public displayForm = false;

  public displaySignUpForm(value: boolean) {
    this.displayForm = value;
  }
}
