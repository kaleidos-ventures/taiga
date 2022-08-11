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
import { AppService } from '~/app/services/app.service';
import { Observable } from 'rxjs';
import { randDomainSuffix } from '@ngneat/falso';

import { KanbanEffects } from './kanban.effects';
import { KanbanActions, KanbanApiActions } from '../actions/kanban.actions';
import { cold, hot } from 'jest-marbles';
import {
  ProjectMockFactory,
  UserMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';

import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
describe('ProjectEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<KanbanEffects>;
  let store: MockStore;

  const createService = createServiceFactory({
    service: KanbanEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    mocks: [ProjectApiService, AppService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
    const user = UserMockFactory();
    store.overrideSelector(selectUser, user);
  });

  it('init kanban', () => {
    const project = ProjectMockFactory();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const workflows = [WorkflowMockFactory(3)];

    store.overrideSelector(selectCurrentProject, project);

    projectApiService.getWorkflows.mockReturnValue(
      cold('-b|', { b: workflows })
    );

    actions$ = hot('-a', { a: KanbanActions.initKanban() });

    const expected = cold('--a', {
      a: KanbanApiActions.fetchWorkflowsSuccess({ workflows }),
    });

    expect(effects.loadKanbanWorkflows$).toBeObservable(expected);
  });
});
