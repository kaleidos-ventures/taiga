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
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';

import {
  ProjectMockFactory,
  StatusMockFactory,
  StoryMockFactory,
  UserMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { KanbanActions, KanbanApiActions } from '../actions/kanban.actions';
import { KanbanEffects } from './kanban.effects';

import { randNumber } from '@ngneat/falso';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { fetchProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  selectCurrentProject,
  selectCurrentProjectSlug,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanStoryA11y } from '~/app/modules/project/feature-kanban/kanban.model';
import { selectCurrentWorkflowSlug } from '../selectors/kanban.selectors';
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
      status: 403,
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
      a: KanbanApiActions.createStoryError({ status: 403, story }),
    });

    const expected = cold('-a', {
      a: fetchProject({ slug: project.slug }),
    });

    expect(effects.createStoryError$).toBeObservable(expected);

    expect(effects.createStoryError$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalled();
    });
  });

  it('move story keyboard', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const story = StoryMockFactory();

    projectApiService.moveStory.mockReturnValue(cold('-b|', { b: story }));

    const status = StatusMockFactory();

    const fakeStoryposition = {
      status: status.slug,
      index: randNumber(),
    };

    const kanbanStory: KanbanStoryA11y = {
      ref: story.ref,
      prevPosition: fakeStoryposition,
      initialPosition: fakeStoryposition,
      currentPosition: fakeStoryposition,
    };

    const workflow = WorkflowMockFactory();

    const reorder: {
      place: 'after' | 'before';
      ref: number;
    } = {
      place: 'before',
      ref: randNumber(),
    };

    actions$ = hot('-a', {
      a: KanbanActions.dropStoryA11y({
        story: kanbanStory,
        workflow,
        reorder,
      }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.moveStorySuccess({ story }),
    });

    expect(effects.moveStoryKeyboard$).toBeObservable(expected);
  });

  it('move story mouse', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const story = StoryMockFactory();
    const status = StatusMockFactory();
    const workflow = WorkflowMockFactory();
    const project = ProjectMockFactory();

    store.overrideSelector(selectCurrentProjectSlug, project.slug);
    store.overrideSelector(selectCurrentWorkflowSlug, workflow.slug);

    projectApiService.moveStory.mockReturnValue(cold('-b|', { b: story }));

    actions$ = hot('-a', {
      a: KanbanActions.storyDropped({
        ref: story.ref,
        candidate: {
          ref: 1111,
          position: 'bottom',
        },
        status: status.slug,
      }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.moveStorySuccess({ story }),
    });

    expect(effects.moveStoryMouse$).toSatisfyOnFlush(() => {
      expect(effects.moveStoryMouse$).toBeObservable(expected);
      expect(projectApiService.moveStory).toHaveBeenCalledWith(
        {
          ref: story.ref,
          status: status.slug,
        },
        project.slug,
        workflow.slug,
        {
          place: 'after',
          ref: 1111,
        }
      );
    });
  });
});
