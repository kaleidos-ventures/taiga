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
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TuiLinkModule } from '@taiga-ui/core';
import { InvitationParams, SignUpError } from '@taiga/data';
import { InlineNotificationComponent } from '@taiga/ui/inline-notification';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { PasswordStrengthComponent } from '@taiga/ui/inputs/password-strength/password-strength.component';
import {
  signup,
  signUpError,
  signUpSuccess,
} from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { SignUp } from '~/app/modules/auth/feature-sign-up/models/sign-up.model';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';
import { ExternalLinkModule } from '~/app/shared/directives/external-link/external-link.module';
import { GetUrlPipeModule } from '~/app/shared/pipes/get-url/get-url.pipe.module';

@UntilDestroy()
@Component({
  selector: 'tg-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css', '../../styles/sign-up.shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonTemplateModule,
    ReactiveFormsModule,
    InputsModule,
    GetUrlPipeModule,
    ButtonLoadingModule,
    TuiLinkModule,
    ExternalLinkModule,
    InlineNotificationComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_overview',
        alias: 'project_overview',
      },
    },
  ],
})
export class SignupComponent implements OnInit {
  @Input()
  public data: SignUp | null = null;

  @Input()
  public isEmailReadonly!: boolean;

  @Input()
  public invitation!: InvitationParams;

  @Output()
  public displayLoginOptions = new EventEmitter();

  @Output()
  public signUpSuccess = new EventEmitter();

  public destroyRef = inject(DestroyRef);

  public signUpForm!: FormGroup;
  public fullNameOnlyEmojis = false;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private el: ElementRef,
    private actions$: Actions,
    private cd: ChangeDetectorRef
  ) {
    this.actions$
      .pipe(ofType(signUpError), untilDestroyed(this))
      .subscribe((action) => {
        const response = action.response.error as SignUpError;
        const error = response.error;
        if (action.response.status === 400) {
          if (error.detail === 'email-already-exists-error') {
            (this.signUpForm.get('email') as FormControl).setErrors({
              exists: true,
            });
          }
        } else if (Array.isArray(error.detail)) {
          error.detail.forEach((error) => {
            if (
              error.loc[1] === 'email' &&
              error.type === 'value_error.email'
            ) {
              (this.signUpForm.get('email') as FormControl).setErrors({
                email: true,
              });
            }
          });
        }
        this.cd.detectChanges();
      });

    this.actions$
      .pipe(ofType(signUpSuccess), untilDestroyed(this))
      .subscribe(() => {
        this.signUpDone();
        this.cd.detectChanges();
      });
  }

  public ngOnInit(): void {
    this.signUpForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [
        null,
        [Validators.required, PasswordStrengthComponent.validator],
      ],
      fullName: [null, [Validators.required]],
      projectInvitationToken: null,
      acceptProjectInvitation: null,
      workspaceInvitationToken: null,
      acceptWorkspaceInvitation: null,
    });
    if (this.data) {
      this.signUpForm.setValue(this.data);
    }

    this.signUpForm
      .get('fullName')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: string) => {
        this.fullNameOnlyEmojis = this.isOnlyEmojis(value);
      });
  }

  public onSubmit() {
    const signUpFormData = this.signUpForm.value as SignUp;
    if (this.signUpForm.valid) {
      this.store.dispatch(
        signup({
          email: signUpFormData.email,
          password: signUpFormData.password,
          fullName: signUpFormData.fullName,
          acceptTerms: true,
          resend: false,
          acceptProjectInvitation: signUpFormData.acceptProjectInvitation,
          projectInvitationToken: signUpFormData.projectInvitationToken,
          acceptWorkspaceInvitation: signUpFormData.acceptWorkspaceInvitation,
          workspaceInvitationToken: signUpFormData.workspaceInvitationToken,
        })
      );
    } else {
      this.signUpForm.markAllAsTouched();
      this.cd.detectChanges();
    }
  }

  public viewAllOptions() {
    this.displayLoginOptions.next(this.signUpForm.value);
  }

  public signUpDone() {
    this.signUpSuccess.next(this.signUpForm.value);
  }

  public isOnlyEmojis(str: string): boolean {
    const regEx =
      /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/g;

    return regEx.test(str.replaceAll(' ', '').trim());
  }
}
