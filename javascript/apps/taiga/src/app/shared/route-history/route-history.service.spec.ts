/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Router } from '@angular/router';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { RouteHistoryService } from './route-history.service';

describe('RouteHistoryService', () => {
  let spectator: SpectatorService<RouteHistoryService>;

  const createService = createServiceFactory({
    service: RouteHistoryService,
    imports: [getTranslocoModule()],
    providers: [
      {
        provide: Router,
        useValue: {
          navigateByUrl: () => {
            return null;
          },
        },
      },
    ],
    entryComponents: [],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('get previous URL', () => {
    spectator.service.previousUrl = 'http://localhost:4200/start';
    expect(spectator.service.getPreviousUrl()).toBe(
      'http://localhost:4200/start'
    );
  });

  it('go back without previous URL', () => {
    const router = spectator.inject(Router);
    const routerSpy = jest.spyOn(router, 'navigateByUrl');
    spectator.service.back();
    expect(routerSpy).toHaveBeenCalledWith('/');
  });

  it('go back with previous URL', () => {
    const URL = 'http://localhost:4200/start';
    spectator.service.previousUrl = URL;
    const router = spectator.inject(Router);
    const routerSpy = jest.spyOn(router, 'navigateByUrl');
    spectator.service.back();
    expect(routerSpy).toHaveBeenCalledWith(URL);
  });
});
