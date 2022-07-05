/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { ConfigService } from '@taiga/core';

interface SocialParams {
  social: string;
  redirect: string;
}

@Component({
  selector: 'tg-social-login-button',
  templateUrl: './social-login-button.component.html',
  styleUrls: ['./social-login-button.component.css'],
})
export class SocialLoginButtonComponent {
  @Input() public social!: keyof ConfigService['social'];

  constructor(
    private config: ConfigService,
    private router: Router,
    private translocoService: TranslocoService
  ) {}

  public get socialImage() {
    return `/assets/images/social/${this.social}.svg`;
  }

  public get socialText() {
    const translationKey = `auth.social.${this.social}`;
    return this.translocoService.translate(translationKey);
  }

  public get socialURL() {
    const socialConfig = this.config.social[this.social];
    let socialAuthUrl = '';
    let scope = '';
    if (this.social === 'github') {
      socialAuthUrl = 'https://github.com/login/oauth/authorize';
      scope = 'user:email';
    } else if (this.social === 'gitlab') {
      socialAuthUrl = `${socialConfig.serverUrl as string}/oauth/authorize`;
      scope = 'read_user';
    }
    const clientId = socialConfig.clientId;
    const redirectUri = `${window.location.origin}/signup/${this.social}`;
    const params: SocialParams = {
      social: this.social,
      redirect: this.router.url,
    };
    const qs = Object.keys(params)
      .map((key) => {
        return `${key}=${params[key as keyof SocialParams]}`;
      })
      .join('&');
    const encodedParams = encodeURIComponent(qs);
    return `${socialAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${encodedParams}&scope=${scope}`;
  }
}
