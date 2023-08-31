/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { randDomainSuffix, randUuid, randWord } from '@ngneat/falso';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ProjectMockFactory } from '@taiga/data';
import { Subject } from 'rxjs';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { ProjectNavigationSettingsComponent } from './project-navigation-settings.component';

const projectId = randUuid();
const projectName = randDomainSuffix({ length: 3 }).join('-');
const fragment = randWord();

describe('ProjectSettingsComponent', () => {
  const animationEvents$ = new Subject();
  let spectator: Spectator<ProjectNavigationSettingsComponent>;
  const createComponent = createComponentFactory({
    component: ProjectNavigationSettingsComponent,
    imports: [getTranslocoModule(), RouterTestingModule],
    declareComponent: false,
    mocks: [RouteHistoryService],
    shallow: true,
  });

  beforeEach(() => {
    spectator = createComponent({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            fragment,
            snapshot: {
              params: {
                id: projectId,
                slug: projectName,
              },
              data: {
                settings: true,
              },
            },
          },
        },
      ],
      detectChanges: false,
    });
    spectator.component.project = ProjectMockFactory();

    animationEvents$.next({
      toState: 'open-settings',
      phaseName: 'done',
    });
  });

  it('get history nav - has history', () => {
    spectator.component.ngOnInit = jest.fn();
    spectator.component.getFragment = jest.fn();
    spectator.component.getRouter = jest
      .fn()
      .mockReturnValue({ url: '/router' });
    spectator.component.isSettings = jest.fn().mockReturnValue(false);

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
    spectator.component.getRouter = jest
      .fn()
      .mockReturnValue({ url: '/router' });
    spectator.component.isSettings = jest.fn().mockReturnValue(false);

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
    spectator.component.getRouter = jest
      .fn()
      .mockReturnValue({ url: '/router' });
    spectator.component.isSettings = jest.fn().mockReturnValue(true);

    const routeHistory =
      spectator.inject<RouteHistoryService>(RouteHistoryService);
    routeHistory.getPreviousUrl.mockReturnValue('');

    spectator.component.getRouter = jest.fn().mockReturnValue({
      url: `/settings`,
    });

    spectator.detectChanges();

    spectator.component.getHistoryNav();

    expect(spectator.component.previousUrl).toEqual(
      `/project/${projectId}/${projectName}/overview`
    );
  });
});
