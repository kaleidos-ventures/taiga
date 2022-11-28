/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { selectLoadingStory } from '../story-detail/data-access/+state/selectors/story-detail.selectors';

export interface StoryState {
  loadingStory: boolean;
}
@Component({
  selector: 'tg-project-feature-story-wrapper-full-view',
  templateUrl: './project-feature-story-wrapper-full-view.component.html',
  styleUrls: ['./project-feature-story-wrapper-full-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectFeatureStoryWrapperFullViewComponent {
  public readonly model$ = this.state.select();

  constructor(private store: Store, private state: RxState<StoryState>) {
    this.state.connect('loadingStory', this.store.select(selectLoadingStory));
  }
}
