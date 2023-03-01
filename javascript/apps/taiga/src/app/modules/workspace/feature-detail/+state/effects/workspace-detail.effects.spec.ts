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
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';
import {
  fetchWorkspace,
  fetchWorkspaceSuccess,
  deleteWorkspace,
  deleteWorkspaceSuccess,
} from '../actions/workspace-detail.actions';
import { WorkspaceDetailEffects } from './workspace-detail.effects';

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

    actions$ = hot('-a', { a: fetchWorkspace({ id }) });

    const expected = cold('--a', {
      a: fetchWorkspaceSuccess({ workspace }),
    });

    expect(effects.loadWorkspace$).toBeObservable(expected);
  });

  it('delete workspace', () => {
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);
    const workspace = EmptyWorkspaceAdminMockFactory();

    workspaceApiService.deleteWorkspace.mockReturnValue(cold('-b|', {}));

    actions$ = hot('-a', {
      a: deleteWorkspace({ id: workspace.id, name: workspace.name }),
    });

    const expected = cold('--a', {
      a: deleteWorkspaceSuccess({ id: workspace.id, name: workspace.name }),
    });

    expect(effects.deleteWorkspace$).toBeObservable(expected);
  });
});
