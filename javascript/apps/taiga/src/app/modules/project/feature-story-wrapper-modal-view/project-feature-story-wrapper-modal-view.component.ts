/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { selectLoadingStory } from '../story-detail/data-access/+state/selectors/story-detail.selectors';
import { StoryDetailComponent } from '../story-detail/story-detail.component';
import { StoryDetailSkeletonComponent } from '../story-detail-skeleton/story-detail-skeleton.component';
import { TuiScrollbarModule } from '@taiga-ui/core/components/scrollbar';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';

export interface StoryState {
  loadingStory: boolean;
}
@Component({
  selector: 'tg-project-feature-story-wrapper-modal-view',
  templateUrl: './project-feature-story-wrapper-modal-view.component.html',
  styleUrls: ['./project-feature-story-wrapper-modal-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TuiScrollbarModule,
    ResizedDirective,
    StoryDetailComponent,
    StoryDetailSkeletonComponent,
  ],
})
export class ProjectFeatureStoryWrapperModalViewComponent {
  @ViewChild(StoryDetailComponent)
  public storyDetailComponent?: StoryDetailComponent;

  @Output()
  public closeModal = new EventEmitter();

  public readonly model$ = this.state.select();

  constructor(private store: Store, private state: RxState<StoryState>) {
    this.state.connect('loadingStory', this.store.select(selectLoadingStory));
  }
}
