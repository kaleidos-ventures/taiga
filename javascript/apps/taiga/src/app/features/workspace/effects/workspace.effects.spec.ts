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
import { Observable } from 'rxjs';

import { WorkspaceMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { WorkspaceEffects } from './workspace.effects';
import { WorkspaceApiService } from '@taiga/api';
import { fetchWorkspaceList, setWorkspaceList } from '../actions/workspace.actions';

describe('WorkspaceEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<WorkspaceEffects>;

  const createService = createServiceFactory({
    service: WorkspaceEffects,
    providers: [
      provideMockActions(() => actions$)
    ],
    mocks: [ WorkspaceApiService ],
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

    actions$ = hot('-a', { a:  fetchWorkspaceList()});

    const expected = cold('--a', {
      a: setWorkspaceList({ workspaces: [workspace] }),
    });

    expect(
      effects.listWorkspaces$
    ).toBeObservable(expected);
  });

});
