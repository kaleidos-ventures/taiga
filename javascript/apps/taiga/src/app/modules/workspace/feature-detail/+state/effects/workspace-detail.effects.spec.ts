/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randDomainSuffix } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';

import { WorkspaceApiService } from '@taiga/api';
import { WorkspaceMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { AppService } from '~/app/services/app.service';
import {
  fetchWorkspace,
  fetchWorkspaceSuccess,
} from '../actions/workspace-detail.actions';
import { WorkspaceDetailEffects } from './workspace-detail.effects';

describe('WorkspaceEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<WorkspaceDetailEffects>;

  const createService = createServiceFactory({
    service: WorkspaceDetailEffects,
    providers: [provideMockActions(() => actions$)],
    mocks: [WorkspaceApiService, AppService],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load workspace', () => {
    const slug = randDomainSuffix({ length: 3 }).join('-');
    const workspace = WorkspaceMockFactory();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    workspaceApiService.fetchWorkspaceDetail.mockReturnValue(
      cold('-b|', { b: workspace })
    );

    actions$ = hot('-a', { a: fetchWorkspace({ slug }) });

    const expected = cold('--a', {
      a: fetchWorkspaceSuccess({ workspace }),
    });

    expect(effects.loadWorkspace$).toBeObservable(expected);
  });
});
