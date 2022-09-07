/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { fadeIntOutAnimation } from '~/app/shared/utils/animations';
import { AuthService } from '../services/auth.service';
@UntilDestroy()
@Component({
  selector: 'tg-auth-feature-login',
  templateUrl: './auth-feature-login.component.html',
  styleUrls: ['./auth-feature-login.component.css'],
  animations: [fadeIntOutAnimation],
})
export class AuthFeatureLoginComponent implements OnInit {
  public queryParams$!: typeof this.route.queryParams;

  constructor(private route: ActivatedRoute, private authService: AuthService) {
    document.querySelector('tui-alert-host')?.classList.add('no-menu');
  }

  public get displaySocialNetworks() {
    return this.authService.displaySocialNetworks();
  }

  public ngOnInit() {
    this.queryParams$ = this.route.queryParams;
  }
}
