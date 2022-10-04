/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { filter, map } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { WsService } from '~/app/services/ws';
import {
  KanbanActions,
  KanbanEventsActions,
} from './data-access/+state/actions/kanban.actions';
import { KanbanState } from './data-access/+state/reducers/kanban.reducer';
import {
  selectLoadingWorkflows,
  selectWorkflows,
} from './data-access/+state/selectors/kanban.selectors';
import { Story } from '@taiga/data';
import { PermissionsService } from '~/app/services/permissions.service';
import { Router } from '@angular/router';
import { AppService } from '~/app/services/app.service';
import { TuiNotification } from '@taiga-ui/core';
import { filterNil } from '~/app/shared/utils/operators';
import { concatLatestFrom } from '@ngrx/effects';

interface ComponentState {
  loadingWorkflows: KanbanState['loadingWorkflows'];
  workflows: KanbanState['workflows'];
  invitePeopleModal: boolean;
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
  public model$ = this.state.select().pipe(
    map((state) => {
      const hasStatuses =
        state.workflows?.find((workflow) => {
          return workflow.statuses.length;
        }) ?? true;

      return {
        ...state,
        isEmpty: !hasStatuses,
      };
    })
  );

  constructor(
    private store: Store,
    private state: RxState<ComponentState>,
    private wsService: WsService,
    private permissionService: PermissionsService,
    private router: Router,
    private appService: AppService
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

  public project$ = this.store.select(selectCurrentProject);

  public closeModal() {
    this.state.set({ invitePeopleModal: false });
  }

  public trackBySlug(_index: number, obj: { slug: string }) {
    return obj.slug;
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
  }

  private checkInviteModalStatus() {
    const state = window.history.state as { invite: boolean } | undefined;
    this.state.set({ invitePeopleModal: !!state?.invite });
  }
}
