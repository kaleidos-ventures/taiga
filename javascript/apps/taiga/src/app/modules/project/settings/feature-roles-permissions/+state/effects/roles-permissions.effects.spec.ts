/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { ProjectApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import { Observable } from 'rxjs';
import { randNumber } from '@ngneat/falso';

import { RolesPermissionsEffects } from './roles-permissions.effects';
import {
  fetchMemberRolesSuccess,
  initRolesPermissions,
} from '../actions/roles-permissions.actions';
import { cold, hot } from 'jest-marbles';
import { ProjectMockFactory, RoleMockFactory } from '@taiga/data';

describe('RolesPermissionsEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<RolesPermissionsEffects>;

  const createService = createServiceFactory({
    service: RolesPermissionsEffects,
    providers: [provideMockActions(() => actions$)],
    mocks: [ProjectApiService, AppService],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load roles', () => {
    const project = ProjectMockFactory();
    const roles = [];
    for (let i = 0; i++; i < randNumber()) {
      const role = RoleMockFactory();
      roles.push(role);
    }
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(RolesPermissionsEffects);

    projectApiService.getMemberRoles.mockReturnValue(cold('-b|', { b: roles }));

    actions$ = hot('-a', { a: initRolesPermissions({ project }) });

    const expected = cold('--a', {
      a: fetchMemberRolesSuccess({ roles }),
    });

    expect(effects.loadMemberRoles$).toBeObservable(expected);
  });
});
