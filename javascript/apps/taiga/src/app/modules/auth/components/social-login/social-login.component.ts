/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from '@taiga/core';

@Component({
  selector: 'tg-social-login',
  templateUrl: './social-login.component.html',
  styleUrls: ['./social-login.component.css'],
})
export class SocialLoginComponent implements OnInit {
  constructor(
    private config: ConfigService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  public socialError: string | null = null;
  public social: string | null = null;
  public adminEmail: string = this.config.adminEmail;

  public get isGithubActive() {
    return !!this.config.social.github.clientId;
  }

  public get isGitlabActive() {
    return !!this.config.social.gitlab.clientId;
  }

  public ngOnInit(): void {
    this.social = this.route.snapshot.queryParamMap.get('social');
    this.socialError = this.route.snapshot.queryParamMap.get('socialError');
  }
}
