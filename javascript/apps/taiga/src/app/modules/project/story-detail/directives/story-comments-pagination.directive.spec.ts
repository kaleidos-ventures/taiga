/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ElementRef } from '@angular/core';
import { StoryCommentsPaginationDirective } from './story-comments-pagination.directive';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator';
import { storyDetailFeature } from '../data-access/+state/reducers/story-detail.reducer';
import { RxState } from '@rx-angular/state';
import {
  Project,
  ProjectMockFactory,
  Story,
  StoryMockFactory,
} from '@taiga/data';
import { StoryDetailActions } from '../data-access/+state/actions/story-detail.actions';

describe('StoryCommentsPaginationDirective', () => {
  const createDirective = createDirectiveFactory({
    directive: StoryCommentsPaginationDirective,
    providers: [provideMockStore({})],
  });

  let store: MockStore;
  let mockElementRef: ElementRef;
  let spectator: SpectatorDirective<StoryCommentsPaginationDirective>;
  let mockState: RxState<{ project: Project; story: Story }>;
  const project = ProjectMockFactory();
  const story = StoryMockFactory();

  beforeEach(() => {
    mockState = new RxState();

    mockElementRef = {
      nativeElement: {
        scrollTop: 500,
        scrollHeight: 1000,
        getBoundingClientRect: () => ({ height: 100 }),
      },
    };

    spectator = createDirective(`<div tgStoryCommentsPagination></div>`, {
      providers: [
        {
          provide: RxState,
          useValue: mockState,
        },
      ],
    });

    store = spectator.inject(MockStore);
    jest.spyOn(store, 'dispatch');

    spectator.directive['scrollBar'] = mockElementRef;
    mockState.set({ project, story });
  });

  it('prevent call to next page when all comments are loaded', () => {
    store.overrideSelector(storyDetailFeature.selectLoadingComments, false);
    store.overrideSelector(storyDetailFeature.selectTotalComments, 10);
    store.overrideSelector(
      storyDetailFeature.selectComments,
      Array(10).fill({})
    );

    spectator.directive.onScroll();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('prevent call to next page when it is loading', () => {
    store.overrideSelector(storyDetailFeature.selectLoadingComments, true);
    store.overrideSelector(storyDetailFeature.selectTotalComments, 40);
    store.overrideSelector(
      storyDetailFeature.selectComments,
      Array(10).fill({})
    );

    spectator.directive.onScroll();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('prevent call to next page when scroll is not at the bottom', () => {
    store.overrideSelector(storyDetailFeature.selectLoadingComments, false);
    store.overrideSelector(storyDetailFeature.selectTotalComments, 40);
    store.overrideSelector(
      storyDetailFeature.selectComments,
      Array(10).fill({})
    );
    mockElementRef.nativeElement.scrollTop = 0;
    spectator.directive.onScroll();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('call to next page when scroll is at the bottom', () => {
    store.overrideSelector(storyDetailFeature.selectLoadingComments, false);
    store.overrideSelector(storyDetailFeature.selectTotalComments, 40);
    store.overrideSelector(
      storyDetailFeature.selectComments,
      Array(10).fill({})
    );
    mockElementRef.nativeElement.scrollTop = 500;
    spectator.directive.onScroll();

    expect(store.dispatch).toHaveBeenCalledWith(
      StoryDetailActions.nextCommentPage({
        projectId: project.id,
        storyRef: story.ref,
      })
    );
  });
});
