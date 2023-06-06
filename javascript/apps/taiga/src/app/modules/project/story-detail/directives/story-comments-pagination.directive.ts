/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { Subject, filter, map, switchMap, zip } from 'rxjs';
import { RxEffects } from '@rx-angular/state/effects';
import { Store } from '@ngrx/store';
import { storyDetailFeature } from '../data-access/+state/reducers/story-detail.reducer';
import { StoryDetailActions } from '../data-access/+state/actions/story-detail.actions';
import { RxState } from '@rx-angular/state';
import { StoryDetailState } from '../story-detail.component';

@Directive({
  selector: '[tgStoryCommentsPagination]',
  standalone: true,
  providers: [RxEffects],
})
export class StoryCommentsPaginationDirective {
  @HostListener('scroll') public onScroll(): void {
    this.onScroll$.next();
  }

  private onScroll$ = new Subject<void>();
  private store = inject(Store);
  private scrollBar = inject<ElementRef<HTMLElement>>(ElementRef);
  private effects = inject(RxEffects);
  private state = inject<RxState<StoryDetailState>>(RxState);

  constructor() {
    const cantLoadComments$ = zip(
      this.store
        .select(storyDetailFeature.selectLoadingComments)
        .pipe(map((loading) => !loading)),
      zip(
        this.store.select(storyDetailFeature.selectTotalComments),
        this.store.select(storyDetailFeature.selectComments)
      ).pipe(
        map(([total, comments]) => {
          return total !== comments.length;
        })
      )
    ).pipe(map(([a, b]) => a && b));

    const nextCommentPage$ = this.onScroll$.pipe(
      filter(() => !!this.scrollBar?.nativeElement),
      switchMap(() => cantLoadComments$),
      filter((cantLoadComments) => cantLoadComments),
      filter(() => {
        const distance = 500;
        const height =
          this.scrollBar.nativeElement.scrollHeight -
          this.scrollBar.nativeElement.getBoundingClientRect().height;

        return this.scrollBar.nativeElement.scrollTop + distance >= height;
      })
    );

    this.effects.register(nextCommentPage$, () => {
      this.store.dispatch(
        StoryDetailActions.nextCommentPage({
          projectId: this.state.get('project').id,
          storyRef: this.state.get('story').ref,
        })
      );
    });
  }
}
