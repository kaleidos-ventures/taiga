/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ActivatedRoute, Router } from '@angular/router';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
// import { ProjectMockFactory } from '@taiga/data';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { ProjectNavigationSettingsComponent } from './project-navigation-settings.component';

import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { ProjectNavigationComponent } from '~/app/modules/project/feature-navigation/project-feature-navigation.component';
import { randProductName, randWord } from '@ngneat/falso';

const projectName = randProductName();
const fragment = randWord();

describe('ProjectSettingsComponent', () => {
  let spectator: Spectator<ProjectNavigationSettingsComponent>;
  const createComponent = createComponentFactory({
    component: ProjectNavigationSettingsComponent,
    imports: [getTranslocoModule()],
    declareComponent: false,
    mocks: [RouteHistoryService, ProjectNavigationComponent],
    providers: [
      {
        provide: Router,
        useValue: {
          url: '/router',
        },
      },
      {
        provide: ActivatedRoute,
        useValue: {
          fragment,
          snapshot: {
            params: {
              slug: projectName,
            },
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });
  });

  it('get history nav - has history', () => {
    spectator.component.ngOnInit = jest.fn();
    spectator.component.getFragment = jest.fn();

    const routeHistory =
      spectator.inject<RouteHistoryService>(RouteHistoryService);
    routeHistory.getPreviousUrl.mockReturnValue('/route-history');

    spectator.detectChanges();

    spectator.component.getHistoryNav();

    expect(spectator.component.previousUrl).toEqual('/route-history');
  });

  it('get history nav - has no history defaults to current route', () => {
    spectator.component.ngOnInit = jest.fn();
    spectator.component.getFragment = jest.fn();

    const routeHistory =
      spectator.inject<RouteHistoryService>(RouteHistoryService);
    routeHistory.getPreviousUrl.mockReturnValue('');

    spectator.detectChanges();

    spectator.component.getHistoryNav();

    expect(spectator.component.previousUrl).toEqual('/router');
  });

  it('get history nav - first route is on settings', () => {
    spectator.component.ngOnInit = jest.fn();
    spectator.component.getFragment = jest.fn();

    const routeHistory =
      spectator.inject<RouteHistoryService>(RouteHistoryService);
    routeHistory.getPreviousUrl.mockReturnValue('');

    const router = spectator.inject<Router>(Router);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: force this private property value for testing.
    router.url = '/settings';

    spectator.detectChanges();

    spectator.component.getHistoryNav();

    expect(spectator.component.previousUrl).toEqual(`/project/${projectName}/`);
  });
});
