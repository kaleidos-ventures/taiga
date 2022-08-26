/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import {
  initLoginPage,
  login,
} from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { selectLoginError } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { fadeIntOutAnimation } from '~/app/shared/utils/animations';
import { filterNil } from '~/app/shared/utils/operators';

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
})
export class LoginComponent implements OnInit {
  @Input() public projectInvitationToken = '';
  @Input() public acceptProjectInvitation = undefined;
  @Input() public next = '';
  @Input() public nextHasPermission = '';
  @Input() public invitationStatus = '';

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
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  public onSubmit() {
    const { username, password } = this.loginForm.value as Login;
    if (this.loginForm.valid) {
      this.store.dispatch(
        login({
          username,
          password,
          projectInvitationToken: this.projectInvitationToken,
          next: this.next,
          acceptProjectInvitation: this.acceptProjectInvitation === 'true',
          nextHasPermission: this.nextHasPermission
            ? this.nextHasPermission.toLocaleLowerCase() === 'true'
            : false,
          invitationStatus: this.invitationStatus,
        })
      );
    } else {
      this.loginForm.markAllAsTouched();
      this.cd.detectChanges();
    }
  }
}
