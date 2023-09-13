/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import { ConfigService } from '@taiga/cdk/services/config';

interface SocialParams {
  social: string;
  redirect: string;
  projectInvitationToken: string;
  acceptProjectInvitation: string;
  workspaceInvitationToken: string;
  acceptWorkspaceInvitation: string;
}

@Component({
  selector: 'tg-social-login-button',
  standalone: true,
  templateUrl: './social-login-button.component.html',
  styleUrls: ['./social-login-button.component.css'],
  imports: [CommonModule, TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'auth',
        alias: 'auth',
      },
    },
  ],
})
export class SocialLoginButtonComponent {
  @Input() public social!: keyof ConfigService['social'];

  constructor(
    private config: ConfigService,
    private router: Router,
    private translocoService: TranslocoService,
    private route: ActivatedRoute
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
    } else if (this.social === 'google') {
      socialAuthUrl = 'https://accounts.google.com/o/oauth2/auth';
      scope = 'email+profile';
    }
    const clientId = socialConfig.clientId;
    const redirectUri = `${window.location.origin}/signup/${this.social}`;
    const projectInvitationToken =
      this.route.snapshot.queryParamMap.get('projectInvitationToken') || '';
    const acceptProjectInvitation =
      this.route.snapshot.queryParamMap.get('acceptProjectInvitation') || '';
    const workspaceInvitationToken =
      this.route.snapshot.queryParamMap.get('workspaceInvitationToken') || '';
    const acceptWorkspaceInvitation =
      this.route.snapshot.queryParamMap.get('acceptWorkspaceInvitation') || '';
    const params: SocialParams = {
      social: this.social,
      redirect: this.router.url ? this.router.url.match(/^[^?]*/g)!.join() : '',
      projectInvitationToken: '',
      acceptProjectInvitation: '',
      workspaceInvitationToken: '',
      acceptWorkspaceInvitation: '',
    };
    if (projectInvitationToken) {
      params.projectInvitationToken = projectInvitationToken;
      params.acceptProjectInvitation = acceptProjectInvitation;
    } else if (workspaceInvitationToken) {
      params.workspaceInvitationToken = workspaceInvitationToken;
      params.acceptWorkspaceInvitation = acceptWorkspaceInvitation;
    }
    const qs = Object.keys(params)
      .map((key) => {
        return `${key}=${params[key as keyof SocialParams]}`;
      })
      .join('&');
    const encodedParams = encodeURIComponent(qs);
    return `${socialAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${encodedParams}&scope=${scope}`;
  }
}
