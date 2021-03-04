/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from '@/app/services/config/config.service';

@Injectable()
export class ApiRestInterceptorService implements HttpInterceptor {

  constructor(
    private readonly configService: ConfigService) { }

  public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const apiUrl = this.configService.apiUrl;

    // Only add interceptors to request through the api
    if (!request.url.startsWith(apiUrl)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(err);
      })
    );
  }
}
