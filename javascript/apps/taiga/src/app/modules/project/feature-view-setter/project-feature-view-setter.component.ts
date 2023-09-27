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
  DestroyRef,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  startWith,
  combineLatest,
} from 'rxjs';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { StoryDetailActions } from '../story-detail/data-access/+state/actions/story-detail.actions';
import {
  selectStory,
  selectStoryView,
} from '../story-detail/data-access/+state/selectors/story-detail.selectors';

import { ProjectFeatureStoryWrapperFullViewModule } from '../feature-story-wrapper-full-view/project-feature-story-wrapper-full-view.module';
import { filterNil } from '~/app/shared/utils/operators';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';
import { RxState } from '@rx-angular/state';
import { CommonModule } from '@angular/common';
import { StoryDetail, StoryView, Project, Story, Workflow } from '@taiga/data';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ProjectFeatureViewSetterComponentState {
  storyView: StoryView;
  selectStory: StoryDetail | null;
  isKanban: boolean;
  kanbanHost: ViewContainerRef | undefined;
  url: string;
}

interface StoryParams {
  id: Project['id'];
  slug: Project['slug'];
  storyRef: Story['ref'];
}

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
  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private routerHistory: RouteHistoryService,
    private cd: ChangeDetectorRef
  ) {
    this.state.connect('storyView', this.store.select(selectStoryView));
    this.state.connect('selectStory', this.store.select(selectStory));
    this.state.connect(
      'url',
      this.routerHistory.urlChanged.pipe(
        takeUntilDestroyed(this.destroyRef),
        map(({ url }) => url),
        startWith(this.router.url),
        distinctUntilChanged()
      )
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

    combineLatest([
      this.state.select('url'),
      this.route.data,
      this.route.params,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([url, data, params]) => {
        this.state.connect(
          'isKanban',
          this.state
            .select('url')
            .pipe(
              map((url) =>
                url.endsWith(`/kanban/${params.workflow as Workflow['slug']}`)
              )
            )
        );

        if (
          !url.endsWith(`/kanban/${params.workflow as Workflow['slug']}`) &&
          !!data.stories
        ) {
          const storyParams = params as StoryParams;
          const needRedirect = params.slug !== (data.project as Project).slug;
          if (needRedirect) {
            void this.router.navigate(
              [
                `project/${storyParams.id}/${
                  (data.project as Project).slug
                }/stories/${storyParams.storyRef}`,
              ],
              { replaceUrl: true }
            );
          }
          this.fetchStory(storyParams);
        }
      });
  }

  public ngOnDestroy() {
    this.store.dispatch(StoryDetailActions.leaveStoryDetail());
  }

  public getActiveRoute(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    return route.firstChild ? this.getActiveRoute(route.firstChild) : route;
  }

  private fetchStory(params: StoryParams) {
    this.store.dispatch(
      StoryDetailActions.initStory({
        projectId: params.id,
        storyRef: params.storyRef,
      })
    );
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
