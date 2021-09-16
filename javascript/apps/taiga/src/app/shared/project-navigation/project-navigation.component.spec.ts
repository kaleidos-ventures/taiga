/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ProjectNavigationComponent } from './project-navigation.component';
import { ProjectNavigationModule } from './project-navigation.module';

describe('<%= classify(name) %>Component', () => {
  let spectator: Spectator<ProjectNavigationComponent>;
  const createComponent = createComponentFactory({
    component: ProjectNavigationComponent,
    imports: [ProjectNavigationModule],
    declareComponent: false,
    mocks: [
      LocalStorageService,
    ]
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false
    });

  });

  it('example', () => {
    const localStorageService = spectator.inject<LocalStorageService>(LocalStorageService);
    localStorageService.get.mockReturnValue(true);

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(true);
  });
});
