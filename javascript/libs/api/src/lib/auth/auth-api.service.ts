/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@taiga/core';

import { Auth, Language, LoginInput, SignUpInput } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  public login(data: LoginInput) {
    return this.http.post<Auth>(`${this.config.apiUrl}/auth/token`, data);
  }

  public signUp(data: SignUpInput) {
    return this.http.post<Auth>(`${this.config.apiUrl}/users`, data);
  }

  public socialSignUp(code: string, social: string, lang: Language['code']) {
    const params = {
      code,
      lang,
      redirectUri:
        social === 'gitlab' || social === 'google'
          ? `${window.location.origin}/signup/${social}`
          : null,
    };

    return this.http.post<Auth>(`${this.config.apiUrl}/auth/${social}`, params);
  }

  public refreshToken(refresh: Auth['refresh']) {
    return this.http.post<Auth>(`${this.config.apiUrl}/auth/token/refresh`, {
      refresh,
    });
  }

  public denyRefreshToken(refresh: Auth['refresh'] | undefined) {
    return this.http.post<Auth>(`${this.config.apiUrl}/auth/token/deny`, {
      refresh,
    });
  }
}
