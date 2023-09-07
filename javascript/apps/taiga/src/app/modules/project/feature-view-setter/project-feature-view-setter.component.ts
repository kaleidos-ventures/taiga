/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, map, pairwise, startWith } from 'rxjs';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { StoryDetailActions } from '../story-detail/data-access/+state/actions/story-detail.actions';
import {
  selectStory,
  selectStoryView,
} from '../story-detail/data-access/+state/selectors/story-detail.selectors';

import { ProjectFeatureStoryWrapperFullViewModule } from '../feature-story-wrapper-full-view/project-feature-story-wrapper-full-view.module';
import { filterFalsy, filterNil } from '~/app/shared/utils/operators';
import { Router } from '@angular/router';
import { RxState } from '@rx-angular/state';
import { StoryDetail, StoryView } from '@taiga/data';
import { CommonModule } from '@angular/common';

interface ProjectFeatureViewSetterComponentState {
  storyView: StoryView;
  selectStory: StoryDetail | null;
  isKanban: boolean;
  kanbanHost: ViewContainerRef | undefined;
  url: string;
}

@UntilDestroy()
@Component({
  selector: 'tg-project-feature-view-setter',
  templateUrl: './project-feature-view-setter.component.html',
  styleUrls: ['./project-feature-view-setter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ProjectFeatureStoryWrapperFullViewModule],
  providers: [RxState],
})
export class ProjectFeatureViewSetterComponent implements OnDestroy {
  @ViewChild('kanbanHost', { read: ViewContainerRef })
  public set kanbanHost(host: ViewContainerRef | undefined) {
    this.state.set({ kanbanHost: host });
  }

  public state = inject(
    RxState
  ) as RxState<ProjectFeatureViewSetterComponentState>;

  public model$ = this.state.select();

  constructor(
    private router: Router,
    private store: Store,
    private routerHistory: RouteHistoryService,
    private cd: ChangeDetectorRef
  ) {
    this.state.connect('storyView', this.store.select(selectStoryView));
    this.state.connect('selectStory', this.store.select(selectStory));
    this.state.connect(
      'url',
      this.routerHistory.urlChanged.pipe(
        untilDestroyed(this),
        map(({ url }) => url),
        startWith(this.router.url),
        distinctUntilChanged()
      )
    );
    this.state.connect(
      'isKanban',
      this.state.select('url').pipe(map((url) => url.includes('kanban')))
    );

    this.state.hold(
      this.state.select('url').pipe(
        map((url) => url.includes('/stories')),
        filterFalsy()
      ),
      () => {
        this.fetchStory();
      }
    );

    this.state.hold(
      this.state.select('kanbanHost').pipe(distinctUntilChanged(), filterNil()),
      (host) => {
        void this.loadKanban(host);
      }
    );

    this.state.hold(
      this.state.select('isKanban').pipe(
        pairwise(),
        filter(([, next]) => next)
      ),
      () => {
        this.store.dispatch(StoryDetailActions.leaveStoryDetail());
      }
    );
  }

  public ngOnDestroy() {
    this.store.dispatch(StoryDetailActions.leaveStoryDetail());
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

  private async loadKanban(viewContainerRef: ViewContainerRef) {
    const { ProjectFeatureViewSetterKanbanComponent } = await import(
      './project-feature-view-setter.component-kanban.component'
    );

    viewContainerRef.clear();

    viewContainerRef.createComponent(ProjectFeatureViewSetterKanbanComponent);

    this.cd.markForCheck();
  }
}
