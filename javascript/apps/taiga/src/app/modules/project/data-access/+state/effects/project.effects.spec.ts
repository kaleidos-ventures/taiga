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
import { Observable } from 'rxjs';
import { randDomainSuffix, randNumber } from '@ngneat/falso';

import { ProjectEffects } from './project.effects';
import {
  fetchProject,
  fetchProjectSuccess,
  fetchMemberRolesSuccess,
  initRolesPermissions,
} from '../actions/project.actions';
import { cold, hot } from 'jest-marbles';
import { ProjectMockFactory, RoleMockFactory } from '@taiga/data';

describe('ProjectEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<ProjectEffects>;

  const createService = createServiceFactory({
    service: ProjectEffects,
    providers: [provideMockActions(() => actions$)],
    mocks: [ProjectApiService],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load project', () => {
    const slug = randDomainSuffix({ length: 3 }).join('-');
    const project = ProjectMockFactory();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);

    projectApiService.getProject.mockReturnValue(cold('-b|', { b: project }));

    actions$ = hot('-a', { a: fetchProject({ slug }) });

    const expected = cold('--a', {
      a: fetchProjectSuccess({ project }),
    });

    expect(effects.loadProject$).toBeObservable(expected);
  });

  it('load roles', () => {
    const project = ProjectMockFactory();
    const roles = [];
    for (let i = 0; i++; i < randNumber()) {
      const role = RoleMockFactory();
      roles.push(role);
    }
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);

    projectApiService.getMemberRoles.mockReturnValue(cold('-b|', { b: roles }));

    actions$ = hot('-a', { a: initRolesPermissions({ project }) });

    const expected = cold('--a', {
      a: fetchMemberRolesSuccess({ roles }),
    });

    expect(effects.loadMemberRoles$).toBeObservable(expected);
  });
});
