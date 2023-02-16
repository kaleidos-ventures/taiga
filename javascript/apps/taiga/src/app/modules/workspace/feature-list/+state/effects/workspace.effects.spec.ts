/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randUuid } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { WorkspaceApiService } from '@taiga/api';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { AppService } from '~/app/services/app.service';
import {
  fetchWorkspaceList,
  fetchWorkspaceListSuccess,
  fetchWorkspaceProjects,
  fetchWorkspaceProjectsSuccess,
} from '../actions/workspace.actions';
import { WorkspaceEffects } from './workspace.effects';

describe('WorkspaceEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<WorkspaceEffects>;

  const createService = createServiceFactory({
    service: WorkspaceEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    mocks: [WorkspaceApiService, AppService],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load workspace', () => {
    const workspace = WorkspaceMockFactory();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceEffects);

    workspaceApiService.fetchWorkspaceList.mockReturnValue(
      cold('-b|', { b: [workspace] })
    );

    actions$ = hot('-a', { a: fetchWorkspaceList() });

    const expected = cold('--a', {
      a: fetchWorkspaceListSuccess({ workspaces: [workspace] }),
    });

    expect(effects.listWorkspaces$).toBeObservable(expected);
  });

  it('fetch workspace projects', () => {
    const id = randUuid();
    const project = ProjectMockFactory();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceEffects);

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    testScheduler.run((helpers) => {
      const { expectObservable, cold, hot } = helpers;

      workspaceApiService.fetchWorkspaceProjects.mockReturnValue(
        cold('-b|', { b: [project] })
      );

      actions$ = hot('-a', { a: fetchWorkspaceProjects({ id }) });

      expectObservable(effects.fetchWorkspaceProjects$).toBe('300ms -a', {
        a: fetchWorkspaceProjectsSuccess({ id, projects: [project] }),
      });
    });
  });
});
