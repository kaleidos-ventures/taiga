/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { RouterTestingModule } from '@angular/router/testing';
import { ApiRestInterceptorService } from './api-rest-interceptor.service';
import { createHttpFactory, SpectatorHttp } from '@ngneat/spectator/jest';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import * as faker from 'faker';
import { HTTP_INTERCEPTORS, HttpRequest, HttpResponse, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { ConfigService, ConfigServiceMock } from '@taiga/core';
import { provideMockStore } from '@ngrx/store/testing';

describe('ApiRestInterceptor', () => {
  let spectator: SpectatorHttp<ApiRestInterceptorService>;
  const createService = createHttpFactory({
    service: ApiRestInterceptorService,
    imports: [
      RouterTestingModule,
    ],
    mocks: [
      LocalStorageService,
    ],
    providers: [
      { provide: ConfigService, useValue: ConfigServiceMock },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: ApiRestInterceptorService,
        multi: true,
      },
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  // it('add authorization', () => {
  //   const token = faker.datatype.uuid();

  //   const localStorageService = spectator.inject(LocalStorageService);
  //   localStorageService.get.mockReturnValue(token);

  //   const authInterceptorService = spectator.inject(ApiRestInterceptorService);
  //   const apiRequest = new HttpRequest('GET', ConfigServiceMock.apiUrl);

  //   const next = {
  //     handle(request: HttpRequest<any>) {
  //       expect(request.headers.get('Authorization')).toEqual(`Bearer ${ token }`);

  //       return of(new HttpResponse({ status: 200 }));
  //     },
  //   };

  //   authInterceptorService.intercept(apiRequest, next).subscribe();
  // });

  it('snake case request', () => {
    const userId = faker.datatype.number();

    const authInterceptorService = spectator.inject(ApiRestInterceptorService);
    const apiRequest = new HttpRequest(
      'POST',
      ConfigServiceMock.apiUrl, {
        theUser: {
          userId,
        },
      },
      {
        params: new HttpParams({
          fromObject: {
            snakeCaseKey: 'test',
          },
        }),
      }
    );

    const next = {
      handle(request: HttpRequest<any>) {
        expect(request.body).toEqual({
          the_user: {
            user_id: userId,
          },
        });

        expect(request.params.get('snake_case_key')).toBeTruthy();

        return of(new HttpResponse({ status: 200 }));
      },
    };

    authInterceptorService.intercept(apiRequest, next).subscribe();
  });

  it('camel case response', () => {
    const userId = faker.datatype.number();

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

    authInterceptorService.intercept(apiResponse, next).subscribe((response: HttpResponse<any>) => {
      expect(response.body).toEqual({
        theUser: {
          userId,
        },
      });
    });
  });
});
