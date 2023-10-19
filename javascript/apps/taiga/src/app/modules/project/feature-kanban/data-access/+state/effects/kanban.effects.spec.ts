/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import { randFirstName, randNumber, randUserName } from '@ngneat/falso';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ProjectApiService } from '@taiga/api';
import {
  Membership,
  ProjectMockFactory,
  StatusMockFactory,
  StoryMockFactory,
  UserMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { fetchProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  selectCurrentProject,
  selectCurrentProjectId,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanStoryA11y } from '~/app/modules/project/feature-kanban/kanban.model';
import { AppService } from '~/app/services/app.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import {
  KanbanActions,
  KanbanApiActions,
  KanbanEventsActions,
} from '../actions/kanban.actions';
import { selectCurrentWorkflowSlug } from '../selectors/kanban.selectors';
import { KanbanEffects } from './kanban.effects';

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
    imports: [getTranslocoModule()],
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
    const workflow = WorkflowMockFactory(3);

    store.overrideSelector(selectCurrentProject, project);

    projectApiService.getWorkflow.mockReturnValue(cold('-b|', { b: workflow }));

    actions$ = hot('-a', {
      a: KanbanActions.loadWorkflowKanban({ workflow: workflow.slug }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.fetchWorkflowSuccess({ workflow }),
    });

    expect(effects.loadKanbanWorkflows$).toBeObservable(expected);
  });

  it('load stories', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const stories = [StoryMockFactory()];
    const workflow = WorkflowMockFactory(3);

    projectApiService.getAllStories.mockReturnValue(
      cold('-b|', { b: { stories, offset: 0, complete: false } })
    );

    actions$ = hot('-a', {
      a: KanbanActions.initKanban({ workflow: workflow.slug }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.fetchStoriesSuccess({
        stories,
        offset: 0,
        complete: false,
      }),
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
      a: fetchProject({ id: project.id }),
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

    projectApiService.moveStory.mockReturnValue(
      cold('-b|', {
        b: {
          stories: [story.ref],
          status: story.status,
        },
      })
    );

    const status = StatusMockFactory();

    const fakeStoryposition = {
      status: status.id,
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
      a: KanbanApiActions.moveStorySuccess({
        reorder: {
          stories: [story.ref],
          status: story.status,
        },
      }),
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

    store.overrideSelector(selectCurrentProjectId, project.id);
    store.overrideSelector(selectCurrentWorkflowSlug, workflow.slug);

    projectApiService.moveStory.mockReturnValue(
      cold('-b|', {
        b: {
          status: story.status,
          stories: [story.ref],
        },
      })
    );

    actions$ = hot('-a', {
      a: KanbanActions.storyDropped({
        ref: story.ref,
        candidate: {
          ref: 1111,
          position: 'bottom',
        },
        status: status.id,
      }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.moveStorySuccess({
        reorder: {
          stories: [story.ref],
          status: story.status,
        },
      }),
    });

    expect(effects.moveStoryMouse$).toSatisfyOnFlush(() => {
      expect(effects.moveStoryMouse$).toBeObservable(expected);
      expect(projectApiService.moveStory).toHaveBeenCalledWith(
        {
          ref: story.ref,
          status: status.id,
        },
        project.id,
        workflow.slug,
        {
          place: 'after',
          ref: 1111,
        }
      );
    });
  });

  it('assign story', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const story = StoryMockFactory();
    const user: Membership['user'] = {
      fullName: randFirstName(),
      username: randUserName(),
      color: randNumber(),
    };

    projectApiService.assingStory.mockReturnValue(
      cold('-b|', { b: { story, user } })
    );

    actions$ = hot('-a', {
      a: KanbanActions.assignMember({
        storyRef: story.ref,
        member: user,
      }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.assignMemberSuccess(),
    });

    expect(effects.assign$).toBeObservable(expected);
  });

  it('unassign story', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const project = ProjectMockFactory();
    const story = StoryMockFactory();
    const user: Membership['user'] = {
      fullName: randFirstName(),
      username: randUserName(),
      color: randNumber(),
    };
    story.assignees = [user];

    projectApiService.unAssignStory.mockReturnValue(
      cold('-b|', { b: undefined })
    );

    store.overrideSelector(selectCurrentProject, project);

    actions$ = hot('-a', {
      a: KanbanActions.unAssignMember({
        storyRef: story.ref,
        member: user,
      }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.unAssignMemberSuccess(),
    });

    expect(effects.unAssign$).toBeObservable(expected);
  });

  it('delete story', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const story = StoryMockFactory();

    projectApiService.deleteStory.mockReturnValue(cold('-b|', { b: story }));

    const ref = randNumber();

    actions$ = hot('-a', {
      a: KanbanEventsActions.deleteStory({ ref }),
    });

    const expected = cold('-a', {
      a: KanbanActions.deleteStory({ ref }),
    });

    expect(effects.deleteStoryByEvent$).toBeObservable(expected);
  });

  it('create status', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const status = StatusMockFactory();
    const workflow = 'main';

    projectApiService.createStatus.mockReturnValue(cold('-b|', { b: status }));

    actions$ = hot('-a', {
      a: KanbanActions.createStatus({
        status,
        workflow,
      }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.createStatusSuccess({ status, workflow }),
    });

    expect(effects.createStatus$).toBeObservable(expected);
  });

  it('delete status', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(KanbanEffects);
    const status = StatusMockFactory().id;
    const workflow = 'main';
    const moveToStatus = 'done';

    projectApiService.deleteStatus.mockReturnValue(cold('-b|', {}));

    actions$ = hot('-a', {
      a: KanbanActions.deleteStatus({
        status,
        workflow,
        moveToStatus,
      }),
    });

    const expected = cold('--a', {
      a: KanbanApiActions.deleteStatusSuccess({
        status,
        workflow,
        moveToStatus,
      }),
    });

    expect(effects.deleteStatus$).toBeObservable(expected);
  });
});
