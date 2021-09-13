/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { AuthApiService, ProjectApiService } from '@taiga/api';
import { Observable } from 'rxjs';
import { cold, hot } from 'jasmine-marbles';
import * as faker from 'faker';

import { ProjectEffects } from './project.effects';
import { getProject, setProject } from '../actions/project.actions';
import { ProjectMockFactory } from '@taiga/data';

describe('ProjectEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<ProjectEffects>;

  const createService = createServiceFactory({
    service: ProjectEffects,
    providers: [
      provideMockActions(() => actions$)
    ],
    mocks: [ AuthApiService, ProjectApiService ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load project', () => {
    const projectId = faker.datatype.number();
    const project = ProjectMockFactory();
    const effects = spectator.inject(ProjectEffects);

    actions$ = hot('-a', { a:  getProject({ id: projectId })});

    const expected = cold('-a', {
      a: setProject({ project }),
    });

    expect(
      effects.loadProject$
    ).toBeObservable(expected);
  });

});
