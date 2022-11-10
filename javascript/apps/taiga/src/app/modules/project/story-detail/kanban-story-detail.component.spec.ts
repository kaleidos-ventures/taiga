/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import '@ng-web-apis/universal/mocks';
import {
  randBoolean,
  randFullName,
  randNumber,
  randSlug,
  randUserName,
} from '@ngneat/falso';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { RxState } from '@rx-angular/state';
import {
  Project,
  StoryDetail,
  StoryView,
  WorkflowMockFactory,
} from '@taiga/data';
import * as dateFns from 'date-fns';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { KanbanStoryDetailComponent } from './kanban-story-detail.component';

describe('KanbanStoryDetailComponent', () => {
  const initialState = {
    currentProjectSlug: randSlug(),
    projects: {},
    showBannerOnRevoke: randBoolean(),
    showStoryView: randBoolean(),
    loadingStory: randBoolean(),
    currentStory: {
      workflow: WorkflowMockFactory(),
      prev: randNumber(),
      next: randNumber(),
      createdBy: {
        username: randUserName(),
        fullName: randFullName(),
      },
      createdAt: '2014-02-11T11:30:30',
    },
    storyView: 'modal-view',
    updateStoryView: randBoolean(),
  };

  let mockState: RxState<{
    project: Project;
    story: StoryDetail;
    selectedStoryView: StoryView;
    updateStoryView: boolean;
  }> = new RxState();

  let spectator: Spectator<KanbanStoryDetailComponent>;
  const createComponent = createComponentFactory({
    component: KanbanStoryDetailComponent,
    imports: [getTranslocoModule()],
    providers: [
      provideMockStore({ initialState }),
      {
        provide: RxState,
        useValue: mockState,
      },
    ],
  });

  let store: MockStore;

  beforeEach(() => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
    mockState = new RxState();
  });

  it('DateDistance - more than one year includes year', () => {
    initialState.currentStory.createdAt = '2014-02-11T11:30:30';
    spectator.component.story = initialState.currentStory;
    jest.spyOn(dateFns, 'differenceInYears').mockImplementation(() => 1);
    const distance = spectator.component.getStoryDateDistance();
    expect(distance).toBe('Feb 11 2014');
  });

  it('DateDistance - less than one year, more than 6 days', () => {
    initialState.currentStory.createdAt = '2014-02-11T11:30:30';
    spectator.component.story = initialState.currentStory;
    jest.spyOn(dateFns, 'differenceInYears').mockImplementation(() => 0);
    jest.spyOn(dateFns, 'differenceInDays').mockImplementation(() => 10);
    const distance = spectator.component.getStoryDateDistance();
    expect(distance).toBe('Feb 11');
  });

  // Between 60 sec and 6 days text depends on date-fns text so its not tested

  it('DateDistance - less than one year, less than 6 days, less than 60sec', () => {
    initialState.currentStory.createdAt = '2014-02-11T11:30:30';
    spectator.component.story = initialState.currentStory;
    jest.spyOn(dateFns, 'differenceInYears').mockImplementation(() => 0);
    jest.spyOn(dateFns, 'differenceInDays').mockImplementation(() => 0);
    jest.spyOn(dateFns, 'differenceInSeconds').mockImplementation(() => 10);
    const distance = spectator.component.getStoryDateDistance();
    expect(distance).toBe('kanban.story_detail.now');
  });
});
