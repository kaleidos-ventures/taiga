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
import * as faker from 'faker';

import { ProjectEffects } from './project.effects';
import { fetchProject, fetchProjectSuccess, fetchRoles, fetchRolesSuccess } from '../actions/project.actions';
import { cold, hot } from 'jest-marbles';
import { ProjectMockFactory, RoleMockFactory } from '@taiga/data';

describe('ProjectEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<ProjectEffects>;

  const createService = createServiceFactory({
    service: ProjectEffects,
    providers: [
      provideMockActions(() => actions$)
    ],
    mocks: [ ProjectApiService ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load project', () => {
    const slug = faker.datatype.string();
    const project = ProjectMockFactory();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);

    projectApiService.getProject.mockReturnValue(
      cold('-b|', { b: project })
    );

    actions$ = hot('-a', { a:  fetchProject({ slug })});

    const expected = cold('--a', {
      a: fetchProjectSuccess({ project }),
    });

    expect(
      effects.loadProject$
    ).toBeObservable(expected);
  });

  it('load roles', () => {
    const slug = faker.datatype.string();
    const roles = [];
    for(let i = 0; i++; i < faker.datatype.number()) {
      const role = RoleMockFactory();
      roles.push(role);
    }
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);

    projectApiService.getRoles.mockReturnValue(
      cold('-b|', { b: roles })
    );

    actions$ = hot('-a', { a:  fetchRoles({ slug })});

    const expected = cold('--a', {
      a: fetchRolesSuccess({ roles }),
    });

    expect(
      effects.loadRoles$
    ).toBeObservable(expected);
  });

});
