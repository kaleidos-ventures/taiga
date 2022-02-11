/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component } from '@angular/core';
import { ConfigService } from '@taiga/core';
import { Router } from '@angular/router';

@Component({
  selector: 'tg-error-500',
  templateUrl: './error-500.component.html',
  styleUrls: ['./error-500.component.css'],
})
export class Error500Component {
  constructor(private router: Router, public config: ConfigService) {}

  public backHome() {
    void this.router.navigate(['/']);
  }
}
