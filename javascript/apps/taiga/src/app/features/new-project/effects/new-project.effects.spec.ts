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

import { ProjectCreationMockFactory, ProjectMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { NewProjectEffects } from './new-project.effects';
import { createProject } from '../actions/new-project.actions';
import { fetchWorkspaceList } from '../../workspace/actions/workspace.actions';

describe('NewProjectEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<NewProjectEffects>;

  const createService = createServiceFactory({
    service: NewProjectEffects,
    providers: [
      provideMockActions(() => actions$),
    ],
    mocks: [ ProjectApiService ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('create Project', () => {
    const projectCreation = ProjectCreationMockFactory();
    const project = ProjectMockFactory();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(NewProjectEffects);

    projectApiService.createProject.mockReturnValue(
      cold('-b|', { b: project })
    );

    actions$ = hot('-a', { a: createProject({project: projectCreation})});

    const expected = cold('--a', {
      a: fetchWorkspaceList(),
    });

    expect(
      effects.createProject$
    ).toBeObservable(expected);
  });

});
