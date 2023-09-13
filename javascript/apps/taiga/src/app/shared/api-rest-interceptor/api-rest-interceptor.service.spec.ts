/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { RouterTestingModule } from '@angular/router/testing';
import { ApiRestInterceptorService } from './api-rest-interceptor.service';
import { createHttpFactory, SpectatorHttp } from '@ngneat/spectator/jest';
import { randUuid, randNumber } from '@ngneat/falso';
import {
  HTTP_INTERCEPTORS,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { forkJoin, of, throwError } from 'rxjs';
import { ConfigService } from '@taiga/cdk/services/config';
import { ConfigServiceMock } from '@taiga/cdk/services/config/config.service.mock';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AuthApiService } from '@taiga/api';
import { refreshTokenSuccess } from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { Router } from '@angular/router';
import { AppService } from '~/app/services/app.service';

describe('ApiRestInterceptor', () => {
  let spectator: SpectatorHttp<ApiRestInterceptorService>;
  const initialState = { core: { loading: false } };
  let store: MockStore;

  const createService = createHttpFactory({
    service: ApiRestInterceptorService,
    imports: [RouterTestingModule],
    mocks: [AuthService, AuthApiService, Router, AppService],
    providers: [
      { provide: ConfigService, useValue: ConfigServiceMock },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: ApiRestInterceptorService,
        multi: true,
      },
      provideMockStore({ initialState }),
    ],
  });

  beforeEach(() => {
    spectator = createService();

    store = spectator.inject(MockStore);
  });

  it('add authorization', () => {
    const token = randUuid();
    const refresh = randUuid();

    const authService = spectator.inject(AuthService);
    authService.getAuth.mockReturnValue({ token, refresh });

    const authInterceptorService = spectator.inject(ApiRestInterceptorService);
    const apiRequest = new HttpRequest('GET', ConfigServiceMock.apiUrl);

    const next = {
      handle(request: HttpRequest<any>) {
        expect(request.headers.get('Authorization')).toEqual(`Bearer ${token}`);

        return of(new HttpResponse({ status: 200 }));
      },
    };

    authInterceptorService.intercept(apiRequest, next).subscribe();
  });

  // request -> 401 -> refresh token (success) -> refresh auth information, continue initial request
  it('401 with valid refresh token', (done) => {
    const token = randUuid();
    const refresh = randUuid();

    jest.spyOn(store, 'dispatch');

    const authApiService = spectator.inject(AuthApiService);
    const authService = spectator.inject(AuthService);
    authService.getAuth.mockReturnValue({ token, refresh });

    const authInterceptorService = spectator.inject(ApiRestInterceptorService);
    const apiRequest = new HttpRequest('GET', ConfigServiceMock.apiUrl);

    authApiService.refreshToken.andReturn(of({ token, refresh }));
    let count = 0;

    const next = {
      handle() {
        if (!count) {
          count++;
          const err = new HttpErrorResponse({ status: 401, url: '' });

          return throwError(() => err);
        } else {
          return of(new HttpResponse({ status: 200 }));
        }
      },
    };

    authInterceptorService.intercept(apiRequest, next).subscribe(() => {
      expect(authApiService.refreshToken).toHaveBeenCalledWith(refresh);
      expect(store.dispatch).toHaveBeenCalledWith(
        refreshTokenSuccess({ auth: { token, refresh } })
      );

      done();
    });
  });

  // request -> 401 -> refresh token (error) -> logout, initial request error
  it('401 with invalid refresh token', (done) => {
    const token = randUuid();
    const refresh = randUuid();

    jest.spyOn(store, 'dispatch');

    const authApiService = spectator.inject(AuthApiService);
    const router = spectator.inject(Router);

    const authService = spectator.inject(AuthService);
    authService.getAuth.mockReturnValue({ token, refresh });

    const authInterceptorService = spectator.inject(ApiRestInterceptorService);
    const apiRequest = new HttpRequest('GET', ConfigServiceMock.apiUrl);

    authApiService.refreshToken.andReturn(of({ token, refresh }));
    const next = {
      handle() {
        const err = new HttpErrorResponse({ status: 401, url: '' });

        return throwError(() => err);
      },
    };

    authInterceptorService.intercept(apiRequest, next).subscribe({
      error: () => {
        expect(authApiService.refreshToken).toHaveBeenCalledWith(refresh);
        expect(router.navigate).toHaveBeenCalledWith([`/logout`]);

        done();
      },
    });
  });

  it('multiples request, 401 with valid refresh token', (done) => {
    const token = randUuid();
    const refresh = randUuid();

    jest.spyOn(store, 'dispatch');

    const authApiService = spectator.inject(AuthApiService);

    const authService = spectator.inject(AuthService);
    authService.getAuth.mockReturnValue({ token, refresh });

    const authInterceptorService = spectator.inject(ApiRestInterceptorService);
    const apiRequest = new HttpRequest('GET', ConfigServiceMock.apiUrl);
    const nextApiRequest = new HttpRequest('GET', ConfigServiceMock.apiUrl);

    authApiService.refreshToken.andReturn(of({ token, refresh }));
    let count = 0;

    const initialRequest = {
      handle() {
        if (!count) {
          count++;
          const err = new HttpErrorResponse({ status: 401, url: '' });

          return throwError(() => err);
        } else {
          return of(new HttpResponse({ status: 200 }));
        }
      },
    };

    const nextRequest = {
      handle() {
        return of(new HttpResponse({ status: 200 }));
      },
    };

    forkJoin([
      authInterceptorService.intercept(apiRequest, initialRequest),
      authInterceptorService.intercept(nextApiRequest, nextRequest),
    ]).subscribe(() => {
      expect(authApiService.refreshToken).toHaveBeenCalledWith(refresh);
      expect(store.dispatch).toHaveBeenCalledWith(
        refreshTokenSuccess({ auth: { token, refresh } })
      );

      done();
    });
  });

  it('camel case response', () => {
    const userId = randNumber();

    const authInterceptorService = spectator.inject(ApiRestInterceptorService);
    const apiResponse = new HttpResponse({
      url: ConfigServiceMock.apiUrl,
      body: {
        theUser: {
          user_id: userId,
        },
      },
    });

    const next = {
      handle: () => {
        return of(new HttpResponse({ status: 200 }));
      },
    };

    authInterceptorService
      .intercept(apiResponse, next)
      .subscribe((response: HttpResponse<any>) => {
        expect(response.body).toEqual({
          theUser: {
            userId,
          },
        });
      });
  });
});
