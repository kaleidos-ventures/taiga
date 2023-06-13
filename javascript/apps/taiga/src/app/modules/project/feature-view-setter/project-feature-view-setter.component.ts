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
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { RxEffects } from '@rx-angular/state/effects';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { StoryDetailActions } from '../story-detail/data-access/+state/actions/story-detail.actions';
import {
  selectStory,
  selectStoryView,
} from '../story-detail/data-access/+state/selectors/story-detail.selectors';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { ProjectFeatureStoryWrapperFullViewModule } from '../feature-story-wrapper-full-view/project-feature-story-wrapper-full-view.module';
import { filterNil } from '~/app/shared/utils/operators';
@UntilDestroy()
@Component({
  selector: 'tg-project-feature-view-setter',
  templateUrl: './project-feature-view-setter.component.html',
  styleUrls: ['./project-feature-view-setter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonTemplateModule, ProjectFeatureStoryWrapperFullViewModule],
  providers: [RxEffects],
})
export class ProjectFeatureViewSetterComponent {
  @ViewChild('kanbanHost', { read: ViewContainerRef })
  public set kanbanHost(host: ViewContainerRef | undefined) {
    this.kanbanHost$.next(host);
  }

  public storyView$ = this.store.select(selectStoryView);
  public selectStory$ = this.store.select(selectStory);
  public isKanban = false;
  public kanbanHost$ = new BehaviorSubject<ViewContainerRef | undefined>(
    undefined
  );

  private effects = inject(RxEffects);

  constructor(
    private store: Store,
    private routerHistory: RouteHistoryService,
    private cd: ChangeDetectorRef
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

    this.effects.register(
      this.kanbanHost$.pipe(distinctUntilChanged(), filterNil()),
      (host) => {
        void this.loadKanban(host);
      }
    );
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
