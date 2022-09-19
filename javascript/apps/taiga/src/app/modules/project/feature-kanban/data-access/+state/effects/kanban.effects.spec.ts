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

import { KanbanEffects } from './kanban.effects';
import { KanbanActions, KanbanApiActions } from '../actions/kanban.actions';
import { cold, hot } from 'jest-marbles';
import {
  ProjectMockFactory,
  StoryMockFactory,
  UserMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';

import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { fetchProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
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

  it('load stories', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const stories = [StoryMockFactory()];

    projectApiService.getAllStories.mockReturnValue(
      cold('-b|', { b: { stories, offset: 0 } })
    );

    actions$ = hot('-a', { a: KanbanActions.initKanban() });

    const expected = cold('--a', {
      a: KanbanApiActions.fetchStoriesSuccess({ stories, offset: 0 }),
    });

    expect(effects.loadKanbanStories$).toBeObservable(expected);
  });

  it('create story', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const story = StoryMockFactory();

    projectApiService.createStory.mockReturnValue(cold('-b|', { b: story }));

    const tmpStory = {
      tmpId: '1',
      ...story,
    };

    actions$ = hot('-a', {
      a: KanbanActions.createStory({
        story: tmpStory,
        workflow: 'main',
      }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.createStorySuccess({ story, tmpId: '1' }),
    });

    expect(effects.createStory$).toBeObservable(expected);
  });

  it('create story error', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const appService = spectator.inject(AppService);
    const story = StoryMockFactory();

    const error = {
      status: 401,
    };

    const tmpStory = {
      tmpId: '1',
      ...story,
    };

    projectApiService.createStory.mockReturnValue(cold('-#|', {}, error));

    actions$ = hot('-a', {
      a: KanbanActions.createStory({ story: tmpStory, workflow: 'main' }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.createStoryError({
        status: error.status,
        story: tmpStory,
      }),
    });

    expect(effects.createStory$).toBeObservable(expected);

    expect(effects.createStory$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).not.toHaveBeenCalled();
    });
  });

  it('create story error notification', () => {
    const project = ProjectMockFactory();
    const effects = spectator.inject(KanbanEffects);
    const appService = spectator.inject(AppService);
    const story = StoryMockFactory();

    store.overrideSelector(selectCurrentProject, project);

    actions$ = hot('-a', {
      a: KanbanApiActions.createStoryError({ status: 401, story }),
    });

    const expected = cold('-a', {
      a: fetchProject({ slug: project.slug }),
    });

    expect(effects.createStoryError$).toBeObservable(expected);

    expect(effects.createStoryError$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalled();
    });
  });
});
