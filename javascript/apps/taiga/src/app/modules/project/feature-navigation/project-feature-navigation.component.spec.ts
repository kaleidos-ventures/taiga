/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import {
  createComponentFactory,
  mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { ProjectMockFactory } from '@taiga/data';
import { Subject } from 'rxjs';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { ProjectNavigationComponent } from './project-feature-navigation.component';

describe('ProjectNavigationComponent', () => {
  const events$ = new Subject();
  let spectator: Spectator<ProjectNavigationComponent>;
  const createComponent = createComponentFactory({
    component: ProjectNavigationComponent,
    imports: [CommonModule, getTranslocoModule()],
    schemas: [NO_ERRORS_SCHEMA],
    mocks: [LocalStorageService],
    providers: [
      mockProvider(Router, {
        events: events$,
        url: '/settings',
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });

    spectator.component.project = ProjectMockFactory(true);
  });

  it('default', () => {
    const mockLocalStorageServiceGet = jest.fn().mockReturnValue(true);
    LocalStorageService.get = mockLocalStorageServiceGet;

    spectator.detectChanges();
    events$.next(undefined);

    expect(spectator.component.collapsed).toEqual(true);
  });

  it('on init check if project navigation bar is collapsed - true', () => {
    const mockLocalStorageServiceGet = jest.fn().mockReturnValue(true);
    LocalStorageService.get = mockLocalStorageServiceGet;

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(true);
  });

  it('on init check if project navigation bar is collapsed - false', () => {
    const mockLocalStorageServiceGet = jest.fn().mockReturnValue(false);
    LocalStorageService.get = mockLocalStorageServiceGet;

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(false);
  });
});
