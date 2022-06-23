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

  public githubError: string | null = null;
  public adminEmail: string = this.config.adminEmail;

  public get githubOauthURL() {
    const githubConfig = this.config.social.github;
    const ghAuthUrl = githubConfig.authUrl;
    const clientId = githubConfig.clientId;
    const redirectUri = `${githubConfig.redirectUri}?redirect=${this.router.url}`;
    return `${ghAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&state=github&scope=user:email`;
  }

  public get isGithubActive() {
    return !!this.config.social.github.clientId;
  }

  public ngOnInit(): void {
    this.githubError = this.route.snapshot.queryParamMap.get('githubError');
  }
}
