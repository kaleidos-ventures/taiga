/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor, HttpResponse} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigService } from '@taiga/core';
import { Store } from '@ngrx/store';
import { getGlobalLoading, globalLoading } from '@taiga/core';
import { concatLatestFrom } from '@ngrx/effects';
@Injectable()
export class ApiRestInterceptorService implements HttpInterceptor {
  public requests = new BehaviorSubject([] as HttpRequest<unknown>[]);

  constructor(
    private readonly configService: ConfigService,
    private readonly store: Store) {
    this.requests.pipe(
      concatLatestFrom(() => this.store.select(getGlobalLoading))
    ).subscribe(([requests, loading]) => {
      if (requests.length && !loading) {
        this.store.dispatch(globalLoading({ loading: true }))
      } else if (!requests.length && loading) {
        // Is async to run this action after http effect actions
        requestAnimationFrame(() => {
          this.store.dispatch(globalLoading({ loading: false }))
        });
      }
    });
  }

  public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const apiUrl = this.configService.apiUrl;

    // Only add interceptors to request through the api
    if (!request.url.startsWith(apiUrl)) {
      return next.handle(request);
    }

    this.addRequest(request);

    return next.handle(request).pipe(
      tap((response) => {
        if (response instanceof HttpErrorResponse || response instanceof HttpResponse) {
          this.remvoveRequest(request);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        return throwError(err);
      })
    );
  }

  public addRequest(request: HttpRequest<unknown>) {
    this.requests.next([
      ...this.requests.value,
      request
    ]);
  }

  public remvoveRequest(request: HttpRequest<unknown>) {
    this.requests.next(this.requests.value.filter((it) => it !== request));
  }
}
