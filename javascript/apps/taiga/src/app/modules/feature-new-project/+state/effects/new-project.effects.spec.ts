/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { ProjectApiService } from '@taiga/api';
import { ProjectCreationMockFactory, ProjectMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';
import {
  createProject,
  createProjectSuccess,
} from '../actions/new-project.actions';
import { NewProjectEffects } from './new-project.effects';

describe('NewProjectEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<NewProjectEffects>;

  const createService = createServiceFactory({
    service: NewProjectEffects,
    providers: [provideMockActions(() => actions$)],
    imports: [RouterTestingModule],
    mocks: [ProjectApiService, Router, AppService],
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

    effects.createProject$.subscribe();

    actions$ = hot('-a', { a: createProject({ project: projectCreation }) });

    const expected = cold('--a', {
      a: createProjectSuccess({ project }),
    });

    expect(effects.createProject$).toBeObservable(expected);
  });

  it('create project success', () => {
    const projectCreation = ProjectCreationMockFactory();
    const project = ProjectMockFactory();
    const effects = spectator.inject(NewProjectEffects);

    effects.createProjectSuccess$.subscribe();

    const router = spectator.inject(Router);

    actions$ = hot('-a--b', {
      a: createProject({ project: projectCreation }),
      b: createProjectSuccess({ project }),
    });

    expect(effects.createProjectSuccess$).toSatisfyOnFlush(() => {
      expect(router.navigate).toHaveBeenCalledWith(
        ['/project/', project.id, project.slug, 'kanban', 'main'],
        { state: { invite: true } }
      );
    });
  });
});
