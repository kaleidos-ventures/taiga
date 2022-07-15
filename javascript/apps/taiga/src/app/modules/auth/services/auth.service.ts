/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { AuthApiService } from '@taiga/api';
import { ConfigService } from '@taiga/core';
import { Auth, User } from '@taiga/data';
import { WsService } from '@taiga/ws';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private refreshTokenInterval?: ReturnType<typeof setInterval>;

  constructor(
    private localStorageService: LocalStorageService,
    private authApiService: AuthApiService,
    private config: ConfigService,
    private wsService: WsService
  ) {}

  public isLogged() {
    const user = this.getUser();
    const auth = this.getAuth();

    return !!(user && auth?.refresh && auth.token);
  }

  public getAuth(): Auth | undefined {
    return this.localStorageService.get<Auth>('auth');
  }

  public setAuth(auth: Auth) {
    this.wsService.command('signin', { token: auth.token }).subscribe();
    return this.localStorageService.set('auth', auth);
  }

  public getUser(): User | undefined {
    return this.localStorageService.get<User>('user');
  }

  public setUser(user: User) {
    return this.localStorageService.set('user', user);
  }

  public logout() {
    this.wsService.command('signout').subscribe();
    this.localStorageService.remove('user');
    this.localStorageService.remove('auth');

    if (this.refreshTokenInterval) {
      clearInterval(this.refreshTokenInterval);
    }
  }

  public autoRefresh() {
    this.refreshTokenInterval = setInterval(() => {
      const refreshToken = this.getAuth()?.refresh;

      if (refreshToken) {
        this.authApiService.refreshToken(refreshToken).subscribe((auth) => {
          this.setAuth(auth);
        });
      }
    }, 1000 * 3600 * 3);
  }

  public displaySocialNetworks() {
    const social = this.config.social;
    const isGithubConfigured = !!social.github.clientId;
    const isGitlabConfigured = !!social.gitlab.clientId;
    const isGoogleConfigured = !!social.google.clientId;
    return isGithubConfigured || isGitlabConfigured || isGoogleConfigured;
  }
}
