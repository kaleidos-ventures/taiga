/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  Component,
  ChangeDetectionStrategy,
  HostBinding,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { InvitationParams } from '@taiga/data';
import { AuthService } from '../services/auth.service';
import { SignUp } from './models/sign-up.model';
@UntilDestroy()
@Component({
  selector: 'tg-sign-up',
  templateUrl: './auth-feature-sign-up.component.html',
  styleUrls: [
    './auth-feature-sign-up.component.css',
    './styles/sign-up.shared.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFeatureSignUpComponent implements OnInit {
  @HostBinding('class.verify-email') public displayVerifyEmail = false;
  @HostBinding('class.waves') public waves = true;

  public displayForm = false;
  public signUpFormData: SignUp = {
    email: '',
    fullName: '',
    password: '',
    acceptProjectInvitation: true,
    projectInvitationToken: '',
  };
  public params: InvitationParams = {
    email: '',
    project: '',
    projectInvitationToken: '',
    slug: '',
    acceptProjectInvitation: true,
  };
  public readOnlyEmail = false;

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  public get displaySocialNetworks() {
    return this.authService.displaySocialNetworks();
  }

  public ngOnInit() {
    this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
      this.params = {
        ...params,
        acceptProjectInvitation: params.acceptProjectInvitation === 'true',
      } as InvitationParams;
      if (this.params.email) {
        this.readOnlyEmail = true;
        this.signUpFormData.email = this.params.email;
      }
      if (this.params.projectInvitationToken) {
        this.displaySignUpForm(true);
        this.signUpFormData.projectInvitationToken =
          this.params.projectInvitationToken;
      }
      if ('acceptProjectInvitation' in this.params) {
        this.signUpFormData.acceptProjectInvitation =
          this.params?.acceptProjectInvitation;
      }
    });
  }

  public keepFormData(data: SignUp) {
    this.signUpFormData = data;
    this.displaySignUpForm(false);
  }

  public signUpSucess(data: SignUp) {
    this.signUpFormData = data;
    this.displayVerifyEmail = true;
  }

  public displaySignUpForm(value: boolean) {
    this.displayForm = value;
  }
}
