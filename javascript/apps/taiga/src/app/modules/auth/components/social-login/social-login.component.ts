/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { ConfigService } from '@taiga/core';

import { SocialLoginButtonComponent } from '../social-login-button/social-login-button.component';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';

@Component({
  selector: 'tg-social-login',
  standalone: true,
  templateUrl: './social-login.component.html',
  styleUrls: ['./social-login.component.css'],
  imports: [
    CommonModule,
    TranslocoModule,
    SocialLoginButtonComponent,
    ContextNotificationComponent,
  ],
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
export class SocialLoginComponent implements OnInit {
  constructor(private config: ConfigService, private route: ActivatedRoute) {}

  public socialError: string | null = null;
  public social: string | null = null;
  public availableLogins: string[] = [];
  public supportEmail: string = this.config.supportEmail;

  public get isGithubActive() {
    return (
      !!this.config.social.github.clientId &&
      (!this.availableLogins.length || this.availableLogins.includes('github'))
    );
  }

  public get isGitlabActive() {
    return (
      !!this.config.social.gitlab.clientId &&
      (!this.availableLogins.length || this.availableLogins.includes('gitlab'))
    );
  }

  public get isGoogleActive() {
    return (
      !!this.config.social.google.clientId &&
      (!this.availableLogins.length || this.availableLogins.includes('google'))
    );
  }

  public ngOnInit(): void {
    this.social = this.route.snapshot.queryParamMap.get('social');
    this.socialError = this.route.snapshot.queryParamMap.get('socialError');
    this.availableLogins =
      this.route.snapshot.queryParamMap.get('availableLogins')?.split(',') ||
      [];
  }
}
