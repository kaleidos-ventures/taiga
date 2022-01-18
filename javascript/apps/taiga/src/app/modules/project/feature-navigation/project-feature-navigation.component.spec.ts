/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Router } from '@angular/router';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { ProjectMockFactory } from '@taiga/data';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

import { ProjectNavigationComponent } from './project-feature-navigation.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

describe('ProjectNavigationComponent', () => {
  let spectator: Spectator<ProjectNavigationComponent>;
  const createComponent = createComponentFactory({
    component: ProjectNavigationComponent,
    imports: [
      CommonModule,
      getTranslocoModule(),
    ],
    schemas: [NO_ERRORS_SCHEMA],
    mocks: [
      LocalStorageService,
      Router,
    ]
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false
    });

    spectator.component.project = ProjectMockFactory(true);
  });

  it('default', () => {
    const localStorageService = spectator.inject<LocalStorageService>(LocalStorageService);
    localStorageService.get.mockReturnValue(true);

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(true);
  });

  it('on init check if project navigation bar is collapsed - true', () => {
    const localStorageService = spectator.inject<LocalStorageService>(LocalStorageService);
    localStorageService.get.mockReturnValue(true);

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(true);
  });

  it('on init check if project navigation bar is collapsed - false', () => {
    const localStorageService = spectator.inject<LocalStorageService>(LocalStorageService);
    localStorageService.get.mockReturnValue(false);

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(false);
  });

});

