/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthApiService } from '@taiga/api';
import { ConfigService } from '@taiga/cdk/services/config';
import { Auth } from '@taiga/data';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { refreshTokenSuccess } from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { AuthService } from '~/app/modules/auth/services/auth.service';

@Injectable()
export class ApiRestInterceptorService implements HttpInterceptor {
  public requests = new BehaviorSubject([] as HttpRequest<unknown>[]);
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<null | Auth['token']>(null);

  constructor(
    private readonly authApiService: AuthApiService,
    private readonly configService: ConfigService,
    private readonly store: Store,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  public intercept(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const apiUrl = this.configService.apiUrl;

    // Only add interceptors to request through the api
    if (!request.url.startsWith(apiUrl)) {
      return next.handle(request);
    }

    request = this.authInterceptor(request);
    request = this.correlationInterceptor(request);

    this.addRequest(request);

    return next.handle(request).pipe(
      tap((response) => {
        if (
          response instanceof HttpErrorResponse ||
          response instanceof HttpResponse
        ) {
          this.removeRequest(request);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          const auth = this.authService.getAuth();
          if (
            auth?.token &&
            auth.refresh &&
            !request.url.includes('/auth/token')
          ) {
            return this.handle401Error(request, next);
          } else if (
            (!auth?.token || !auth?.refresh) &&
            !request.url.includes('/auth/token')
          ) {
            void this.router.navigate(['/logout']);
            return EMPTY;
          }
        }
        return throwError(() => err);
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addRequest(request: HttpRequest<any>) {
    this.requests.next([...this.requests.value, request]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public removeRequest(request: HttpRequest<any>) {
    this.requests.next(this.requests.value.filter((it) => it !== request));
  }

  private authInterceptor(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const auth = this.authService.getAuth();

    if (auth?.token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
    }

    return request;
  }

  private correlationInterceptor(
    request: HttpRequest<unknown>
  ): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        'correlation-id': this.configService.correlationId,
      },
    });
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

            this.authService.setAuth(auth);

            this.store.dispatch(refreshTokenSuccess({ auth }));

            // resume pending request with new token
            this.refreshTokenSubject.next(auth.token);

            return next.handle(this.authInterceptor(request));
          }),
          catchError((err: HttpErrorResponse) => {
            this.refreshTokenInProgress = false;

            void this.router.navigate(['/logout']);

            return throwError(() => err);
          })
        );
      }
    }

    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap(() => next.handle(this.authInterceptor(request)))
    );
  }
}
