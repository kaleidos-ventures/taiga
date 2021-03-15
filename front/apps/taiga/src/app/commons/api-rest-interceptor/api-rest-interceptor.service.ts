/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor, HttpResponse} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigService } from '@/app/services/config/config.service';
import { Store } from '@ngrx/store';
import { CoreState, globalLoading } from '@taiga/core';
import { concatLatestFrom } from '@ngrx/effects';
@Injectable()
export class ApiRestInterceptorService implements HttpInterceptor {
  public requests = new BehaviorSubject([] as HttpRequest<unknown>[]);

  constructor(
    private readonly configService: ConfigService,
    private readonly store: Store<CoreState>) {
    this.requests.pipe(
      concatLatestFrom(() => this.store.select((state) => {
        console.log(state);
        return state.loading;
      }))
    ).subscribe(([requests, loading]) => {
      if (requests.length && !loading) {
        this.store.dispatch(globalLoading({ loading: true }))
      } else if (!requests.length && loading) {
        this.store.dispatch(globalLoading({ loading: false }))
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
