/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import {
  initLoginPage,
  login,
  loginProjectInvitation,
  loginWorkspaceInvitation,
} from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { selectLoginError } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { fadeIntOutAnimation } from '~/app/shared/utils/animations';
import { filterNil } from '~/app/shared/utils/operators';
import { RouterLink } from '@angular/router';
import { TuiLinkModule, TuiButtonModule } from '@taiga-ui/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { InputsModule } from '@taiga/ui/inputs';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';
import { ButtonLoadingDirective } from '~/app/shared/directives/button-loading/button-loading.directive';

interface Login {
  username: string;
  password: string;
}

@Component({
  selector: 'tg-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [RxState],
  animations: [fadeIntOutAnimation],
  standalone: true,
  imports: [
    TranslocoDirective,
    CommonModule,
    InputsModule,
    ReactiveFormsModule,
    TuiLinkModule,
    RouterLink,
    ContextNotificationComponent,
    ButtonLoadingDirective,
    TuiButtonModule,
  ],
})
export class LoginComponent implements OnInit {
  @Input() public projectInvitationToken = '';
  @Input() public acceptProjectInvitation = undefined;
  @Input() public email = '';
  @Input() public next = '';
  @Input() public invitationStatus = '';
  @Input() public nextProjectId = '';
  @Input() public workspaceInvitationToken = '';
  @Input() public acceptWorkspaceInvitation = undefined;
  @Input() public nextWorkspaceId = '';

  public readonly model$ = this.state.select();

  public loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private state: RxState<{ loginError: boolean }>,
    private cd: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.store.dispatch(initLoginPage());
    this.state.connect(
      'loginError',
      this.store.select(selectLoginError).pipe(filterNil())
    );

    this.state.hold(this.store.select(selectLoginError).pipe());

    this.loginForm = this.fb.group({
      username: [this.email, Validators.required],
      password: ['', Validators.required],
    });
  }

  public onSubmit() {
    const { username, password } = this.loginForm.value as Login;
    if (this.loginForm.valid) {
      if (this.projectInvitationToken) {
        this.store.dispatch(
          loginProjectInvitation({
            username,
            password,
            projectInvitationToken: this.projectInvitationToken,
            next: this.next,
            acceptProjectInvitation: this.acceptProjectInvitation === 'true',
            invitationStatus: this.invitationStatus,
            nextProjectId: this.nextProjectId ? this.nextProjectId : undefined,
          })
        );
      } else if (this.workspaceInvitationToken) {
        this.store.dispatch(
          loginWorkspaceInvitation({
            username,
            password,
            invitationStatus: this.invitationStatus,
            next: this.next,
            workspaceInvitationToken: this.workspaceInvitationToken,
            acceptWorkspaceInvitation:
              this.acceptWorkspaceInvitation === 'true',
            nextWorkspaceId: this.nextWorkspaceId
              ? this.nextWorkspaceId
              : undefined,
          })
        );
      } else {
        this.store.dispatch(
          login({
            username,
            password,
          })
        );
      }
    } else {
      this.loginForm.markAllAsTouched();
      this.cd.detectChanges();
    }
  }
}
