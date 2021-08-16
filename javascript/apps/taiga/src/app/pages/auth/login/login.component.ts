/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@ngneat/reactive-forms';
import { AuthApiService } from '@taiga/api';

interface Login {
  username: string;
  password: string;
}

@Component({
  selector: 'tg-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public form!: FormGroup;

  constructor(private fb: FormBuilder, private authApiService: AuthApiService) { }

  public ngOnInit(): void {
    this.form = this.fb.group<Login>({
      username: [''],
      password: [''],
    });
  }

  public onSubmit() {
    const { username, password } = this.form.value as Login;

    if (username && password) {
      this.authApiService.login({
        type: 'normal',
        username,
        password,
      }).subscribe((auth) => {
        console.log(auth);
      });
    }
  }
}
