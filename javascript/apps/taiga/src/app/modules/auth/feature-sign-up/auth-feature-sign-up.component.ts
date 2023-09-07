/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { InvitationParams } from '@taiga/data';
import { AuthService } from '../services/auth.service';
import { SignUp } from './models/sign-up.model';
import { AuthFeatureVerifyEmailComponent } from './components/verify-email/verify-email.component';
import { SignupComponent } from './components/signup/signup.component';
import { TuiButtonModule } from '@taiga-ui/core';
import { SocialLoginComponent } from '../components/social-login/social-login.component';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';
import { InlineNotificationComponent } from '@taiga/ui/inline-notification';
import { ExternalLinkDirective } from '~/app/shared/directives/external-link/external-link.directive';
import { InternalLinkDirective } from '~/app/shared/directives/internal-link/internal-link.directive';
import { getUrlPipe } from '~/app/shared/pipes/get-url/get-url.pipe';
import { TitleComponent } from '~/app/shared/title/title.component';

@UntilDestroy()
@Component({
  selector: 'tg-sign-up',
  templateUrl: './auth-feature-sign-up.component.html',
  styleUrls: [
    './auth-feature-sign-up.component.css',
    './styles/sign-up.shared.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslocoDirective,
    TitleComponent,
    CommonModule,
    ContextNotificationComponent,
    InlineNotificationComponent,
    SocialLoginComponent,
    TuiButtonModule,
    ExternalLinkDirective,
    SignupComponent,
    InternalLinkDirective,
    AuthFeatureVerifyEmailComponent,
    getUrlPipe,
  ],
})
export class AuthFeatureSignUpComponent implements OnInit {
  @HostBinding('class.verify-email') public displayVerifyEmail = false;
  @HostBinding('class.waves') public waves = true;

  @Input() public deletedAccount = false;

  public displayForm = false;
  public signUpFormData: SignUp = {
    email: '',
    fullName: '',
    password: '',
    acceptProjectInvitation: true,
    projectInvitationToken: '',
    acceptWorkspaceInvitation: true,
    workspaceInvitationToken: '',
  };
  public params: InvitationParams = {
    email: '',
    project: '',
    workspace: '',
    projectInvitationToken: '',
    slug: '',
    acceptProjectInvitation: true,
    acceptWorkspaceInvitation: true,
    workspaceInvitationToken: '',
  };
  public readOnlyEmail = false;

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {
    document.querySelector('tui-alert-host')?.classList.add('no-menu');
  }

  public get displaySocialNetworks() {
    return this.authService.displaySocialNetworks();
  }

  public ngOnInit() {
    this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
      this.params = {
        ...params,
        acceptProjectInvitation: params.acceptProjectInvitation === 'true',
        acceptWorkspaceInvitation: params.acceptWorkspaceInvitation === 'true',
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
        this.cd.detectChanges();
      }
      if (this.params.workspaceInvitationToken) {
        this.displaySignUpForm(true);
        this.signUpFormData.workspaceInvitationToken =
          this.params.workspaceInvitationToken;
      }
      if ('acceptWorkspaceInvitation' in this.params) {
        this.signUpFormData.acceptWorkspaceInvitation =
          this.params?.acceptWorkspaceInvitation;
        this.cd.detectChanges();
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

  public showSignUp() {
    this.displayVerifyEmail = false;
    this.signUpFormData = {
      email: '',
      fullName: '',
      password: '',
      acceptProjectInvitation: true,
      projectInvitationToken: '',
      acceptWorkspaceInvitation: true,
      workspaceInvitationToken: '',
    };
    this.displayForm = false;
  }
}
