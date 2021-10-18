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
import * as faker from 'faker';

import { WorkspaceMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { WorkspaceApiService } from '@taiga/api';
import { getWorkspace, setWorkspace } from '../actions/workspace-detail.actions';
import { WorkspaceDetailEffects } from './workspace-detail.effects';

describe('WorkspaceEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<WorkspaceDetailEffects>;

  const createService = createServiceFactory({
    service: WorkspaceDetailEffects,
    providers: [
      provideMockActions(() => actions$)
    ],
    mocks: [ WorkspaceApiService ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load workspace', () => {
    const slug = faker.datatype.string();
    const workspace = WorkspaceMockFactory();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    workspaceApiService.fetchWorkspace.mockReturnValue(
      cold('-b|', { b: workspace })
    );

    actions$ = hot('-a', { a:  getWorkspace({ slug })});

    const expected = cold('--a', {
      a: setWorkspace({ workspace }),
    });

    expect(
      effects.loadWorkspace$
    ).toBeObservable(expected);
  });

});
