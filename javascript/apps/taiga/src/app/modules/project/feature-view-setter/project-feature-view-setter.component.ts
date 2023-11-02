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
  ComponentRef,
  DestroyRef,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  of,
  pairwise,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { StoryDetailActions } from '../story-detail/data-access/+state/actions/story-detail.actions';
import {
  selectStory,
  selectStoryView,
} from '../story-detail/data-access/+state/selectors/story-detail.selectors';

import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';
import { RxState } from '@rx-angular/state';
import { Project, Story, StoryDetail, StoryView, Workflow } from '@taiga/data';
import { filterNil } from '~/app/shared/utils/operators';
import { ProjectFeatureStoryWrapperFullViewModule } from '../feature-story-wrapper-full-view/project-feature-story-wrapper-full-view.module';
import { selectRouteParams } from '~/app/router-selectors';
import { ProjectFeatureViewSetterKanbanComponent } from './project-feature-view-setter.component-kanban.component';

interface ProjectFeatureViewSetterComponentState {
  storyView: StoryView;
  selectStory: StoryDetail | null;
  isKanban: boolean;
  kanbanHost: ViewContainerRef | undefined;
  url: string;
  workflowSlug: Workflow['slug'];
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

  private kanbanComponent?: ComponentRef<ProjectFeatureViewSetterKanbanComponent>;
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

    this.state.connect(
      'workflowSlug',
      this.store.select(selectRouteParams).pipe(
        switchMap((params): Observable<string> => {
          if (params.workflow) {
            return of(params.workflow as string);
          }

          if (params.storyRef) {
            return this.store.select(selectStory).pipe(
              filterNil(),
              map((story) => {
                return story?.workflow.slug ?? 'main';
              })
            );
          }

          return of('main');
        }),
        distinctUntilChanged(),
        tap((workflowSlug) => {
          this.kanbanComponent?.setInput('workflowSlug', workflowSlug);
        })
      )
    );

    combineLatest([this.route.data, this.route.params])
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe(([data, params]) => {
        const url = this.state.get('url');
        const project: Project = data.project as Project;
        const isKanbanUrl = url.includes(`${project.slug}/kanban/`);
        this.state.set({ isKanban: isKanbanUrl });

        if (!isKanbanUrl && !!data.stories) {
          const storyParams = params as StoryParams;
          const needRedirect = params.slug !== project.slug;
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

    this.kanbanComponent = viewContainerRef.createComponent(
      ProjectFeatureViewSetterKanbanComponent
    );

    this.kanbanComponent?.setInput(
      'workflowSlug',
      this.state.get('workflowSlug')
    );

    this.cd.markForCheck();
  }
}
