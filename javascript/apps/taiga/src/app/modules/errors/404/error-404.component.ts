/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from '@taiga/core';

@Component({
  selector: 'tg-error-404',
  templateUrl: './error-404.component.html',
  styleUrls: ['./error-404.component.css'],
})
export class Error404Component {
  constructor(private router: Router, public config: ConfigService) {}

  public backHome() {
    void this.router.navigate(['/']);
  }
}
