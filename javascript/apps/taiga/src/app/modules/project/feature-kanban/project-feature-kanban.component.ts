/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiNotification } from '@taiga-ui/core';
import { ShortcutsService } from '@taiga/core';
import { Project, Story, StoryDetail, StoryView } from '@taiga/data';
import { filter, map } from 'rxjs';
import {
  clearStory,
  updateStoryShowView,
} from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  selectCurrentProject,
  selectCurrentStory,
  selectShowStoryView,
  selectStoryView,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { AppService } from '~/app/services/app.service';
import { PermissionsService } from '~/app/services/permissions.service';
import { WsService } from '~/app/services/ws';
import { ResizedEvent } from '~/app/shared/resize/resize.model';
import { filterNil } from '~/app/shared/utils/operators';
import {
  KanbanActions,
  KanbanEventsActions,
} from './data-access/+state/actions/kanban.actions';
import { KanbanState } from './data-access/+state/reducers/kanban.reducer';
import {
  selectLoadingWorkflows,
  selectWorkflows,
} from './data-access/+state/selectors/kanban.selectors';
import { KanbanReorderEvent } from './kanban.model';

interface ComponentState {
  loadingWorkflows: KanbanState['loadingWorkflows'];
  workflows: KanbanState['workflows'];
  invitePeopleModal: boolean;
  showStoryDetail: boolean;
  storyView: StoryView;
  project: Project;
  selectedStory: StoryDetail;
}

@UntilDestroy()
@Component({
  selector: 'tg-project-feature-kanban',
  templateUrl: './project-feature-kanban.component.html',
  styleUrls: ['./project-feature-kanban.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectFeatureKanbanComponent {
  public invitePeopleModal = false;
  public kanbanWidth = 0;
  public model$ = this.state.select().pipe(
    map((state) => {
      const hasStatuses =
        state.workflows?.find((workflow) => {
          return workflow.statuses.length;
        }) ?? true;

      this.setCloseShortcut();
      if (state.storyView === 'side-view') {
        this.shortcutsService.setScope('side-view');
      } else {
        this.shortcutsService.deleteScope('side-view');
      }

      return {
        ...state,
        isEmpty: !hasStatuses,
      };
    })
  );
  public showStoryDetail$ = this.store.select(selectShowStoryView);
  public storyView$ = this.store.select(selectStoryView);
  public project$ = this.store.select(selectCurrentProject);

  constructor(
    private store: Store,
    private state: RxState<ComponentState>,
    private wsService: WsService,
    private permissionService: PermissionsService,
    private router: Router,
    private appService: AppService,
    private location: Location,
    public shortcutsService: ShortcutsService
  ) {
    const canViewPage = this.permissionService.hasPermissions('story', [
      'view',
    ]);

    if (!canViewPage) {
      void this.router.navigate(['403']);
      return;
    }
    this.store.dispatch(KanbanActions.initKanban());
    this.checkInviteModalStatus();
    this.state.connect(
      'loadingWorkflows',
      this.store.select(selectLoadingWorkflows)
    );

    this.state.connect(
      'showStoryDetail',
      this.store.select(selectShowStoryView)
    );

    this.state.connect(
      'selectedStory',
      this.store.select(selectCurrentStory).pipe(filterNil())
    );

    this.state.connect('storyView', this.store.select(selectStoryView));
    this.state.connect('workflows', this.store.select(selectWorkflows));
    this.events();

    this.permissionService
      .hasPermissions$('story', ['view'])
      .pipe(
        untilDestroyed(this),
        filter((canView) => !canView),
        concatLatestFrom(() => this.project$.pipe(filterNil()))
      )
      .subscribe(([, project]) => {
        void this.router.navigate(['project', project.slug]);

        this.appService.toastNotification({
          message: 'lost_kanban_access',
          status: TuiNotification.Error,
          scope: 'kanban',
        });
      });
  }

  public setCloseShortcut() {
    this.shortcutsService
      .task('side-view.close')
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        const selectedStory = this.state.get('selectedStory');
        if (selectedStory.ref) {
          const mainFocus = document.querySelector(
            `tg-kanban-story[data-ref='${selectedStory.ref}'] .story-kanban-ref-focus`
          );
          if (mainFocus) {
            (mainFocus as HTMLElement).focus();
          }
        }
        this.closeSideview();
      });
  }

  public closeSideview() {
    this.store.dispatch(
      updateStoryShowView({
        showView: false,
      })
    );
    this.shortcutsService.deleteScope('side-view');
  }

  public closeModal() {
    this.state.set({ invitePeopleModal: false });
  }

  public closeViewModal() {
    this.store.dispatch(clearStory());
  }

  public trackBySlug(_index: number, obj: { slug: string }) {
    return obj.slug;
  }

  public onResized(event: ResizedEvent) {
    this.kanbanWidth = event.newRect.width;
  }

  private events() {
    this.wsService
      .projectEvents<{ story: Story }>('stories.create')
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        this.store.dispatch(
          KanbanEventsActions.newStory({ story: msg.event.content.story })
        );
      });

    this.wsService
      .projectEvents<KanbanReorderEvent>('stories.reorder')
      .pipe(untilDestroyed(this))
      .subscribe((event) => {
        this.store.dispatch(
          KanbanEventsActions.reorderStory(event.event.content.reorder)
        );
      });
  }

  private checkInviteModalStatus() {
    const state = window.history.state as { invite: boolean } | undefined;
    this.state.set({ invitePeopleModal: !!state?.invite });
  }
}
