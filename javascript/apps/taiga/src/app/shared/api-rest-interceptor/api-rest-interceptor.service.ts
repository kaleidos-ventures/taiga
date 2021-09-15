/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor, HttpResponse, HttpParams} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ConfigService } from '@taiga/core';
import { Store } from '@ngrx/store';
import { getGlobalLoading, globalLoading } from '@taiga/core';
import { concatLatestFrom } from '@ngrx/effects';
import { camelCase, snakeCase } from 'change-case';
import { UtilsService } from '~/app/shared/utils/utils-service.service';

@Injectable()
export class ApiRestInterceptorService implements HttpInterceptor {
  public requests = new BehaviorSubject([] as HttpRequest<unknown>[]);

  constructor(
    private readonly configService: ConfigService,
    private readonly store: Store) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // private authInterceptor(request: HttpRequest<any>): HttpRequest<any> {
  //   const token = this.localStorageService.get<string>('token');

  //   if (token) {
  //     return request.clone({
  //       setHeaders: {
  //         Authorization: `Bearer ${ token }`,
  //       },
  //     });
  //   }

  //   return request;
  // }
}
