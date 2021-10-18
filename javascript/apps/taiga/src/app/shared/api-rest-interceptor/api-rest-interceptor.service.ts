/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor, HttpResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { ConfigService } from '@taiga/core';
import { Store } from '@ngrx/store';
import { getGlobalLoading, globalLoading } from '@taiga/core';
import { concatLatestFrom } from '@ngrx/effects';
import { camelCase, snakeCase } from 'change-case';
import { UtilsService } from '~/app/shared/utils/utils-service.service';
import { Auth } from '@taiga/data';
import { loginSuccess, logout } from '~/app/features/auth/actions/auth.actions';
import { AuthApiService } from '@taiga/api';
import { AuthService } from '~/app/features/auth/services/auth.service';
import { Router } from '@angular/router';
import { AppService } from '~/app/services/app.service';

@Injectable()
export class ApiRestInterceptorService implements HttpInterceptor {
  public requests = new BehaviorSubject([] as HttpRequest<unknown>[]);
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<null|Auth['token']>(null);

  constructor(
    private readonly appService: AppService,
    private readonly authApiService: AuthApiService,
    private readonly configService: ConfigService,
    private readonly store: Store,
    private readonly authService: AuthService,
    private readonly router: Router) {
    this.requests.pipe(
      concatLatestFrom(() => this.store.select(getGlobalLoading))
    // eslint-disable-next-line ngrx/no-store-subscription
    ).subscribe(([requests, loading]) => {
      if (requests.length && !loading) {
        this.store.dispatch(globalLoading({ loading: true }));
      } else if (!requests.length && loading) {
        // Is async to run this action after http effect actions
        requestAnimationFrame(() => {
          this.store.dispatch(globalLoading({ loading: false }));
        });
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const apiUrl = this.configService.apiUrl;

    // Only add interceptors to request through the api
    if (!request.url.startsWith(apiUrl)) {
      return next.handle(request);
    }

    request = this.authInterceptor(request);

    if (request instanceof HttpRequest) {
      request = this.snakeCaseRequestInterceptor(request);
    }

    this.addRequest(request);

    return next.handle(request).pipe(
      map((event) => {
        if (event instanceof HttpResponse) {
          return this.camelCaseResponseInterceptor(event);
        }

        return event;
      }),
      tap((response) => {
        if (response instanceof HttpErrorResponse || response instanceof HttpResponse) {
          this.remvoveRequest(request);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          const auth = this.authService.getAuth();

          if (auth?.token && auth.refresh && !request.url.includes('/auth/token')) {
            return this.handle401Error(request, next);
          } else if (!auth?.token || !auth?.refresh) {
            void this.router.navigate(['login']);
          }
        } else if (err.status !== 403) {
          this.store.dispatch(
            this.appService.unexpectedHttpErrorResponseAction(err)
          );
        }

        return throwError(err);
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private camelCaseResponseInterceptor(event: HttpResponse<any>): HttpResponse<any> {
    const body = UtilsService.objKeysTransformer(event.body, camelCase);
    return event.clone({ body });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addRequest(request: HttpRequest<any>) {
    this.requests.next([
      ...this.requests.value,
      request
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public remvoveRequest(request: HttpRequest<any>) {
    this.requests.next(this.requests.value.filter((it) => it !== request));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private snakeCaseRequestInterceptor(request: HttpRequest<any>): HttpRequest<unknown> {
    let newRequest = request;

    if (newRequest.body) {
      const body = UtilsService.objKeysTransformer(newRequest.body, snakeCase);
      newRequest = newRequest.clone({ body });
    }

    if (newRequest.params) {
      let params: HttpParams = new HttpParams();

      newRequest.params.keys().forEach((key) => {
        const param = newRequest.params.get(key);

        if (param) {
          params = params.append(snakeCase(key), param);
        }
      });

      newRequest = newRequest.clone({ params });
    }

    return newRequest;
  }

  private authInterceptor(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const auth = this.authService.getAuth();

    if (auth?.token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${ auth.token }`,
        },
      });
    }

    return request;
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler) {
    if (!this.refreshTokenInProgress) {
      this.refreshTokenInProgress = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getAuth()?.refresh;

      if (refreshToken) {
        return this.authApiService.refreshToken(refreshToken).pipe(
          switchMap((auth) => {
            this.refreshTokenInProgress = false;

            this.refreshTokenSubject.next(auth.token);

            this.store.dispatch(loginSuccess({ auth }));

            return next.handle(this.authInterceptor(request));
          }),
          catchError((err) => {
            this.refreshTokenInProgress = false;

            this.store.dispatch(logout());
            void this.router.navigate(['login']);

            return throwError(err);
          })
        );
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(() => next.handle(this.authInterceptor(request)))
    );
  }
}
