/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { ConfigService } from '@taiga/core';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { SocialLoginButtonComponent } from '../social-login-button/social-login-button.component';

@Component({
  selector: 'tg-social-login',
  standalone: true,
  templateUrl: './social-login.component.html',
  styleUrls: ['./social-login.component.css'],
  imports: [
    CommonModule,
    TranslocoModule,
    ContextNotificationModule,
    SocialLoginButtonComponent,
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

  public get isGoogleActive() {
    return !!this.config.social.google.clientId;
  }

  public ngOnInit(): void {
    this.social = this.route.snapshot.queryParamMap.get('social');
    this.socialError = this.route.snapshot.queryParamMap.get('socialError');
  }
}
