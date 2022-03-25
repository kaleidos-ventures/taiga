/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component } from '@angular/core';
import { fadeIntOutAnimation } from '~/app/shared/utils/animations';

@Component({
  selector: 'tg-auth-feature-login',
  templateUrl: './auth-feature-login.component.html',
  styleUrls: ['./auth-feature-login.component.css'],
  animations: [fadeIntOutAnimation],
})
export class AuthFeatureLoginComponent {}
