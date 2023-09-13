/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfigService } from '@taiga/cdk/services/config';
import { TuiButtonModule } from '@taiga-ui/core';
import { TranslocoDirective } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tg-error-403',
  templateUrl: './error-403.component.html',
  styleUrls: ['./error-403.component.css'],
  standalone: true,
  imports: [CommonModule, TranslocoDirective, RouterLink, TuiButtonModule],
})
export class Error403Component {
  constructor(private router: Router, public config: ConfigService) {}

  public backHome() {
    void this.router.navigate(['/']);
  }
}
