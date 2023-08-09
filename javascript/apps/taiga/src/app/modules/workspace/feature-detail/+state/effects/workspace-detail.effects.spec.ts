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
import { provideMockStore } from '@ngrx/store/testing';
import { ProjectApiService, WorkspaceApiService } from '@taiga/api';
import {
  EmptyWorkspaceAdminMockFactory,
  WorkspaceMockFactory,
  UserMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';
import { workspaceActions } from '../actions/workspace-detail.actions';
import { WorkspaceDetailEffects } from './workspace-detail.effects';
import { TuiNotification } from '@taiga-ui/core';

describe('WorkspaceEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<WorkspaceDetailEffects>;

  const createService = createServiceFactory({
    service: WorkspaceDetailEffects,
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
    const id = randUuid();
    const workspace = WorkspaceMockFactory();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    workspaceApiService.fetchWorkspaceDetail.mockReturnValue(
      cold('-b|', { b: workspace })
    );

    actions$ = hot('-a', { a: workspaceActions.fetchWorkspace({ id }) });

    const expected = cold('--a', {
      a: workspaceActions.fetchWorkspaceSuccess({ workspace }),
    });

    expect(effects.loadWorkspace$).toBeObservable(expected);
  });

  it('delete workspace', () => {
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);
    const workspace = EmptyWorkspaceAdminMockFactory();

    workspaceApiService.deleteWorkspace.mockReturnValue(cold('-b|', {}));

    actions$ = hot('-a', {
      a: workspaceActions.deleteWorkspace({
        id: workspace.id,
        name: workspace.name,
      }),
    });

    const expected = cold('--a', {
      a: workspaceActions.deleteWorkspaceSuccess({
        id: workspace.id,
        name: workspace.name,
      }),
    });

    expect(effects.deleteWorkspace$).toBeObservable(expected);
  });

  it('should leave workspace successfully', () => {
    const user = UserMockFactory();
    const workspace = WorkspaceMockFactory();

    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const action = workspaceActions.leaveWorkspace({
      id: workspace.id,
      username: user.username,
      name: workspace.name,
    });
    const effects = spectator.inject(WorkspaceDetailEffects);
    const outcome = workspaceActions.leaveWorkspaceSuccess({
      id: workspace.id,
      username: user.username,
      name: workspace.name,
    });

    actions$ = hot('-a', { a: action });
    const response = cold('-a|', { a: {} });
    const expected = cold('--b', { b: outcome });

    workspaceApiService.removeWorkspaceMember.mockReturnValue(response);

    expect(effects.leaveWorkspace$).toBeObservable(expected);
  });

  it('should show message & redirect on leave workspace', () => {
    const user = UserMockFactory();
    const workspace = WorkspaceMockFactory();

    const action = workspaceActions.leaveWorkspaceSuccess({
      id: workspace.id,
      username: user.username,
      name: workspace.name,
    });
    const effects = spectator.inject(WorkspaceDetailEffects);
    const appService = spectator.inject(AppService);
    const router = spectator.inject(Router);

    actions$ = hot('-a', { a: action });

    expect(effects.leaveWorkspaceSucces$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalledWith({
        message: 'workspace.people.remove.no_longer_member',
        paramsMessage: { workspace: action.name },
        status: TuiNotification.Info,
        closeOnNavigation: false,
        autoClose: true,
      });

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
