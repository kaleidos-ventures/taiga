/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { distinctUntilChanged, map } from 'rxjs';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { StoryDetailActions } from '../story-detail/data-access/+state/actions/story-detail.actions';
import {
  selectStory,
  selectStoryView,
} from '../story-detail/data-access/+state/selectors/story-detail.selectors';

@UntilDestroy()
@Component({
  selector: 'tg-project-feature-view-setter',
  templateUrl: './project-feature-view-setter.component.html',
  styleUrls: ['./project-feature-view-setter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectFeatureViewSetterComponent {
  public storyView$ = this.store.select(selectStoryView);
  public selectStory$ = this.store.select(selectStory);
  public isKanban = false;

  constructor(
    private store: Store,
    private routerHistory: RouteHistoryService
  ) {
    const url = window.location.href;
    this.isKanban = url.includes('kanban');

    this.routerHistory.urlChanged
      .pipe(
        untilDestroyed(this),
        map(({ url }) => url),
        distinctUntilChanged()
      )
      .subscribe((url) => {
        this.isKanban = url.includes('kanban');
        const isStory = url.includes('/stories');

        if (isStory) {
          this.fetchStory();
        }
      });

    if (!this.isKanban) {
      this.fetchStory();
    }
  }

  private fetchStory() {
    const params = this.getUrlParams();

    this.store.dispatch(
      StoryDetailActions.initStory({
        projectId: params.projectId,
        storyRef: params.storyRef,
      })
    );
  }

  private getUrlParams() {
    const url = window.location.href;

    return {
      projectId: url.match(/(?<=\/project\/)[^/]+/)![0],
      storyRef: +url.match(/(?<=\/stories\/)[^/]+/)![0],
    };
  }
}
