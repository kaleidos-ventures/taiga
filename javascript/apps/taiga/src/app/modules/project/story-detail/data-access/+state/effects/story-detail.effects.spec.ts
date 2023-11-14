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
import { EMPTY, Observable } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { AppService } from '~/app/services/app.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import {
  selectStory,
  selectStoryView,
  selectWorkflow,
} from '../selectors/story-detail.selectors';
import { StoryDetailEffects } from './story-detail.effects';
import {
  selectCurrentWorkflowSlug,
  selectWorkflow as selectKanbanWorkflow,
} from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { HttpErrorResponse } from '@angular/common/http';

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

    store.overrideSelector(selectCurrentWorkflowSlug, 'main');

    expect(effects.deleteStoryRedirect$).toSatisfyOnFlush(() => {
      expect(router.navigate).toHaveBeenCalledWith([
        `/project/${project.id}/${project.slug}/kanban/main`,
      ]);
    });
  });

  it.skip('should dispatch newStatusOrderAfterDrag action when statusDropped is dispatched and workflow exists', () => {
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

    store.overrideSelector(selectWorkflow, workflow);

    expect(effects.updatesWorkflowStatusAfterDragAndDrop$).toBeObservable(
      expected
    );
  });

  describe('StoryDetailEffects - loadWorkflow$', () => {
    it('should fetch workflow for full-view', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(StoryDetailEffects);
      const project = ProjectMockFactory();
      const story = StoryDetailMockFactory();
      const workflow = WorkflowMockFactory();

      store.overrideSelector(selectCurrentProject, project);
      store.overrideSelector(selectStoryView, 'full-view');
      actions$ = hot('-a', {
        a: StoryDetailApiActions.fetchStorySuccess({ story }),
      });

      projectApiService.getWorkflow.mockReturnValue(
        cold('-b|', { b: workflow })
      );

      const expected = cold('--a', {
        a: StoryDetailApiActions.fetchWorkflowSuccess({ workflow }),
      });

      expect(effects.loadWorkflow$).toSatisfyOnFlush(() => {
        expect(effects.loadWorkflow$).toBeObservable(expected);
        expect(projectApiService.getWorkflow).toHaveBeenCalledWith(
          project.id,
          story.workflow.slug
        );
      });
    });

    it('should reuse kanban workflow', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(StoryDetailEffects);
      const project = ProjectMockFactory();
      const story = StoryDetailMockFactory();
      const kanbanWorkflow = WorkflowMockFactory();
      story.workflow = kanbanWorkflow;

      store.overrideSelector(selectCurrentProject, project);
      store.overrideSelector(selectStoryView, 'modal-view');
      store.overrideSelector(selectKanbanWorkflow, kanbanWorkflow);
      actions$ = hot('-a', {
        a: StoryDetailApiActions.fetchStorySuccess({ story }),
      });

      projectApiService.getWorkflow.mockReturnValue(
        cold('-b|', { b: kanbanWorkflow })
      );

      const expected = cold('--a', {
        a: StoryDetailApiActions.fetchWorkflowSuccess({
          workflow: kanbanWorkflow,
        }),
      });

      expect(effects.loadWorkflow$).toSatisfyOnFlush(() => {
        expect(effects.loadWorkflow$).toBeObservable(expected);
        expect(projectApiService.getWorkflow).not.toHaveBeenCalled();
      });
    });

    it('should fetch workflow', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(StoryDetailEffects);
      const project = ProjectMockFactory();
      const story = StoryDetailMockFactory();
      const workflow = WorkflowMockFactory();

      store.overrideSelector(selectCurrentProject, project);
      store.overrideSelector(selectStoryView, 'full-view');
      store.overrideSelector(selectKanbanWorkflow, null);
      actions$ = hot('-a', {
        a: StoryDetailApiActions.fetchStorySuccess({ story }),
      });

      projectApiService.getWorkflow.mockReturnValue(
        cold('-b|', { b: workflow })
      );

      const expected = cold('--a', {
        a: StoryDetailApiActions.fetchWorkflowSuccess({ workflow }),
      });

      expect(effects.loadWorkflow$).toSatisfyOnFlush(() => {
        expect(effects.loadWorkflow$).toBeObservable(expected);
        expect(projectApiService.getWorkflow).toHaveBeenCalledWith(
          project.id,
          story.workflow.slug
        );
      });
    });

    it('should handle error', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const appService = spectator.inject(AppService);
      const effects = spectator.inject(StoryDetailEffects);
      const project = ProjectMockFactory();
      const story = StoryDetailMockFactory();
      const errorResponse = new HttpErrorResponse({ status: 404 });

      store.overrideSelector(selectCurrentProject, project);
      store.overrideSelector(selectStoryView, 'full-view');
      actions$ = hot('-a', {
        a: StoryDetailApiActions.fetchStorySuccess({ story }),
      });

      projectApiService.getWorkflow.mockReturnValue(
        cold('-#|', {}, errorResponse)
      );

      const expected = cold('--a', {
        a: EMPTY,
      });

      expect(effects.loadWorkflow$).toSatisfyOnFlush(() => {
        expect(effects.loadWorkflow$).toBeObservable(expected);
        expect(appService.errorManagement).toHaveBeenCalledWith(errorResponse);
      });
    });
  });
});
