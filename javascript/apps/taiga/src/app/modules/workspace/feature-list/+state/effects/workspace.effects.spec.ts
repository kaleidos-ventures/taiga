/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Router } from '@angular/router';
import { randUuid } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ProjectApiService, WorkspaceApiService } from '@taiga/api';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { AppService } from '~/app/services/app.service';
import {
  fetchWorkspaceList,
  fetchWorkspaceListSuccess,
  fetchWorkspaceProjects,
  fetchWorkspaceProjectsSuccess,
  membershipLostSuccess,
  projectDeletedSuccess,
  workspaceEventActions,
} from '../actions/workspace.actions';
import { selectWorkspaceState } from '../selectors/workspace.selectors';
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
    mocks: [WorkspaceApiService, AppService, ProjectApiService, Router],
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
  it('should dispatch projectDeletedSuccess with updated workspace when projectDeleted effect is triggered', () => {
    const workspace = WorkspaceMockFactory();
    const updatedWorkspace = { ...workspace, totalProjects: 2 };
    const projectId = '08f6ba0c-597c-4d8c-83cb-b6b60d47ed32';

    const workspaceApiService = spectator.inject(WorkspaceApiService);
    workspaceApiService.fetchWorkspace.mockReturnValue(of(updatedWorkspace));

    const store = spectator.inject(MockStore);
    store.overrideSelector(selectWorkspaceState, {
      workspaces: [workspace],
    });

    const effects = spectator.inject(WorkspaceEffects);

    actions$ = hot('-a', {
      a: workspaceEventActions.projectDeleted({
        workspaceId: workspace.id,
        projectId,
        name: 'Test Project',
      }),
    });

    const expected = cold('-b', {
      b: projectDeletedSuccess({
        updatedWorkspace,
        workspaceId: workspace.id,
        projectId,
      }),
    });

    expect(effects.projectDeleted$).toBeObservable(expected);
  });

  it('should dispatch membershipLostSuccess with updated workspace when membershipLost effect is triggered', () => {
    const workspace = WorkspaceMockFactory();
    const updatedWorkspace = { ...workspace, totalProjects: 2 };
    const projectId = 'bef17ca2-1c53-4bee-8a3a-5681b022a589';

    const workspaceApiService = spectator.inject(WorkspaceApiService);
    workspaceApiService.fetchWorkspace.mockReturnValue(of(updatedWorkspace));

    const store = spectator.inject(MockStore);
    store.overrideSelector(selectWorkspaceState, {
      workspaces: [workspace],
    });

    const effects = spectator.inject(WorkspaceEffects);

    actions$ = hot('-a', {
      a: workspaceEventActions.projectMembershipLost({
        workspaceId: workspace.id,
        projectId,
        name: 'Test Project',
      }),
    });

    const expected = cold('-b', {
      b: membershipLostSuccess({
        updatedWorkspace,
        workspaceId: workspace.id,
        projectId,
      }),
    });

    expect(effects.membershipLost$).toBeObservable(expected);
  });
});
