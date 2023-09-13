/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@taiga/cdk/services/config';
import { Auth, DeleteInfo, User } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  public me() {
    return this.http.get<User>(`${this.config.apiUrl}/my/user`);
  }

  public updateUser(user: Partial<User>) {
    return this.http.put<User>(`${this.config.apiUrl}/my/user`, user);
  }

  public requestResetPassword(email: string) {
    return this.http.post(`${this.config.apiUrl}/users/reset-password`, {
      email,
    });
  }

  public verifyResetPassword(token: string) {
    return this.http.get(
      `${this.config.apiUrl}/users/reset-password/${token}/verify`
    );
  }

  public newPassword(token: string, password: string) {
    return this.http.post<Auth>(
      `${this.config.apiUrl}/users/reset-password/${token}`,
      {
        password,
      }
    );
  }

  public deleteAccountInfo() {
    return this.http.get<DeleteInfo>(
      `${this.config.apiUrl}/my/user/delete-info`
    );
  }

  public deleteAccount() {
    return this.http.delete(`${this.config.apiUrl}/my/user`);
  }
}
