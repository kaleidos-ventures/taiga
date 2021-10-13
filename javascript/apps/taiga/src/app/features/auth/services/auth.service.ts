/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { AuthApiService } from '@taiga/api';
import { Auth, User } from '@taiga/data';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private localStorageService: LocalStorageService,
    private authApiService: AuthApiService) {}

  public isLogged() {
    const user = this.getUser();
    const auth = this.getAuth();

    return user && auth?.refresh && auth.token;
  }

  public getAuth(): Auth | undefined {
    return this.localStorageService.get<Auth>('auth');
  }

  public setAuth(auth: Auth) {
    return this.localStorageService.set('auth', auth);
  }

  public getUser(): User | undefined {
    return this.localStorageService.get<User>('user');
  }

  public setUser(user: User) {
    return this.localStorageService.set('user', user);
  }

  public logout() {
    this.localStorageService.remove('user');
    this.localStorageService.remove('auth');
  }

  public autoRefresh() {
    setInterval(() => {
      const refreshToken = this.getAuth()?.refresh;

      if (refreshToken) {
        // eslint-disable-next-line ngrx/no-store-subscription
        this.authApiService.refreshToken(refreshToken).subscribe((auth) => {
          this.setAuth(auth);
        });
      }
    }, 1000 * 3600 * 3);

  }
}
