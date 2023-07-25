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
import { ProjectApiService } from '@taiga/api';
import {
  ProjectMockFactory,
  StatusMockFactory,
  StoryDetailMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { selectWorkflows } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { AppService } from '~/app/services/app.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import {
  selectStory,
  selectWorkflow,
} from '../selectors/story-detail.selectors';
import { StoryDetailEffects } from './story-detail.effects';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';

describe('StoryDetailEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<StoryDetailEffects>;
  let store: MockStore;

  const createService = createServiceFactory({
    service: StoryDetailEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    imports: [getTranslocoModule()],
    mocks: [ProjectApiService, AppService, Router, LocalStorageService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('loadStoryDetail', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(StoryDetailEffects);
    const story = StoryDetailMockFactory();

    projectApiService.getStory.mockReturnValue(cold('-b|', { b: story }));

    actions$ = hot('-a', {
      a: StoryDetailActions.initStory({
        projectId: randUuid(),
        storyRef: 2,
      }),
    });

    const expected = cold('--a', {
      a: StoryDetailApiActions.fetchStorySuccess({ story }),
    });

    expect(effects.loadStoryDetail$).toBeObservable(expected);
  });

  describe('loadWorkflow', () => {
    it('kanban workflow', () => {
      const project = ProjectMockFactory();
      const workflows = [
        WorkflowMockFactory(),
        WorkflowMockFactory(),
        WorkflowMockFactory(),
      ];
      const effects = spectator.inject(StoryDetailEffects);
      const story = StoryDetailMockFactory();

      story.workflow = {
        slug: workflows[0].slug,
        name: workflows[0].name,
      };

      store.overrideSelector(selectCurrentProject, project);
      store.overrideSelector(selectWorkflows, workflows);
      store.overrideSelector(selectWorkflow, null);

      actions$ = hot('-a', {
        a: StoryDetailApiActions.fetchStorySuccess({
          story,
        }),
      });

      const expected = cold('-a', {
        a: StoryDetailApiActions.fetchWorkflowSuccess({
          workflow: workflows[0],
        }),
      });

      expect(effects.loadWorkflow$).toBeObservable(expected);
    });

    it('previously loaded workflow', () => {
      const project = ProjectMockFactory();
      const workflow = WorkflowMockFactory();
      const effects = spectator.inject(StoryDetailEffects);
      const story = StoryDetailMockFactory();

      story.workflow = {
        slug: workflow.slug,
        name: workflow.name,
      };

      store.overrideSelector(selectCurrentProject, project);
      store.overrideSelector(selectWorkflows, []);
      store.overrideSelector(selectWorkflow, workflow);

      actions$ = hot('-a', {
        a: StoryDetailApiActions.fetchStorySuccess({
          story,
        }),
      });

      const expected = cold('-a', {
        a: StoryDetailApiActions.fetchWorkflowSuccess({
          workflow: workflow,
        }),
      });

      expect(effects.loadWorkflow$).toBeObservable(expected);
    });

    it('request workflow', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const project = ProjectMockFactory();
      const workflows = [
        WorkflowMockFactory(),
        WorkflowMockFactory(),
        WorkflowMockFactory(),
      ];
      const workflow = WorkflowMockFactory();
      const storyWorkflow = WorkflowMockFactory();
      const effects = spectator.inject(StoryDetailEffects);
      const story = StoryDetailMockFactory();

      story.workflow = {
        slug: storyWorkflow.slug,
        name: storyWorkflow.name,
      };

      store.overrideSelector(selectCurrentProject, project);
      store.overrideSelector(selectWorkflows, workflows);
      store.overrideSelector(selectWorkflow, workflow);

      projectApiService.getWorkflow.mockReturnValue(
        cold('-b|', { b: storyWorkflow })
      );

      actions$ = hot('-a', {
        a: StoryDetailApiActions.fetchStorySuccess({
          story,
        }),
      });

      const expected = cold('--a', {
        a: StoryDetailApiActions.fetchWorkflowSuccess({
          workflow: storyWorkflow,
        }),
      });

      expect(effects.loadWorkflow$).toBeObservable(expected);
    });
  });

  it('updateStoryViewMode', () => {
    const localStorageService = spectator.inject(LocalStorageService);
    const project = ProjectMockFactory();
    const effects = spectator.inject(StoryDetailEffects);
    const story = StoryDetailMockFactory();

    store.overrideSelector(selectCurrentProject, project);
    store.overrideSelector(selectStory, story);
    localStorageService.get.mockReturnValue('side-view');

    actions$ = hot('-a', {
      a: StoryDetailActions.updateStoryViewMode({
        storyView: 'full-view',
        previousStoryView: 'modal-view',
      }),
    });

    expect(effects.updateStoryViewMode$).toSatisfyOnFlush(() => {
      expect(localStorageService.set).toHaveBeenCalledWith(
        'story_view',
        'full-view'
      );
    });
  });

  it('updateStoryViewMode from full-view', () => {
    const router = spectator.inject(Router);
    const localStorageService = spectator.inject(LocalStorageService);
    const project = ProjectMockFactory();
    const effects = spectator.inject(StoryDetailEffects);
    const story = StoryDetailMockFactory();

    store.overrideSelector(selectCurrentProject, project);
    store.overrideSelector(selectStory, story);
    localStorageService.get.mockReturnValue('full-view');

    actions$ = hot('-a', {
      a: StoryDetailActions.updateStoryViewMode({
        storyView: 'full-view',
        previousStoryView: 'modal-view',
      }),
    });

    expect(effects.updateStoryViewMode$).toSatisfyOnFlush(() => {
      expect(localStorageService.set).toHaveBeenCalledWith(
        'story_view',
        'full-view'
      );
      // reload the view only if the user is leaving full-view
      expect(router.navigate).toHaveBeenCalledWith([
        `/project/${project.id}/${project.slug}/stories/${story.ref}`,
      ]);
    });
  });

  it('updateStory', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const project = ProjectMockFactory();
    const effects = spectator.inject(StoryDetailEffects);
    const story = StoryDetailMockFactory();
    const storyUpdate = {
      ref: story.ref,
      version: story.version,
    };

    projectApiService.updateStory.mockReturnValue(cold('-b|', { b: story }));

    actions$ = hot('-a', {
      a: StoryDetailActions.updateStory({
        story: storyUpdate,
        projectId: project.id,
      }),
    });

    const expected = cold('--a', {
      a: StoryDetailApiActions.updateStorySuccess({
        story,
      }),
    });

    expect(effects.updateStory$).toBeObservable(expected);
  });

  it('updateStory - error 403 toast', () => {
    const appService = spectator.inject(AppService);
    const projectApiService = spectator.inject(ProjectApiService);
    const project = ProjectMockFactory();
    const effects = spectator.inject(StoryDetailEffects);
    const story = StoryDetailMockFactory();
    const storyUpdate = {
      ref: story.ref,
      version: story.version,
    };

    projectApiService.updateStory.mockReturnValue(
      cold(
        '-#|',
        {},
        {
          status: 403,
        }
      )
    );

    actions$ = hot('-a', {
      a: StoryDetailActions.updateStory({
        story: storyUpdate,
        projectId: project.id,
      }),
    });

    expect(effects.updateStory$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalled();
    });
  });

  it('delete Story', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const project = ProjectMockFactory();
    const effects = spectator.inject(StoryDetailEffects);
    const story = StoryDetailMockFactory();
    const storyDelete = {
      ref: story.ref,
      project,
    };

    projectApiService.deleteStory.mockReturnValue(cold('-b|', { b: story }));

    actions$ = hot('-a', {
      a: StoryDetailActions.deleteStory(storyDelete),
    });

    const expected = cold('--a', {
      a: StoryDetailApiActions.deleteStorySuccess(storyDelete),
    });

    expect(effects.deleteStory$).toBeObservable(expected);
  });

  it('delete Story - redirect', () => {
    const router = spectator.inject(Router);
    const project = ProjectMockFactory();
    const effects = spectator.inject(StoryDetailEffects);
    const story = StoryDetailMockFactory();
    const storyDelete = {
      ref: story.ref,
      project,
    };

    actions$ = hot('-a', {
      a: StoryDetailApiActions.deleteStorySuccess(storyDelete),
    });

    expect(effects.deleteStoryRedirect$).toSatisfyOnFlush(() => {
      expect(router.navigate).toHaveBeenCalledWith([
        `/project/${project.id}/${project.slug}/kanban`,
      ]);
    });
  });

  it('should dispatch newStatusOrderAfterDrag action when statusDropped is dispatched and workflow exists', () => {
    const effects = spectator.inject(StoryDetailEffects);

    const status = StatusMockFactory();
    const status2 = StatusMockFactory();

    const action = KanbanActions.statusDropped({
      id: status2.id,
      candidate: {
        id: status.id,
        position: 'right',
      },
    });

    const workflow = WorkflowMockFactory();
    workflow.statuses = [status, status2];

    actions$ = hot('-a', { a: action });

    const expected = cold('-b', {
      b: StoryDetailActions.newStatusOrderAfterDrag({ workflow }),
    });

    store.overrideSelector(selectWorkflows, [workflow]);
    store.refreshState();

    expect(effects.updatesWorkflowStatusAfterDragAndDrop$).toBeObservable(
      expected
    );
  });
});
