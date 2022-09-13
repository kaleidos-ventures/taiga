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
import { map } from 'rxjs';
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
import { Task } from '@taiga/data';

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
    private wsService: WsService
  ) {
    this.store.dispatch(KanbanActions.initKanban());
    this.checkInviteModalStatus();
    this.state.connect(
      'loadingWorkflows',
      this.store.select(selectLoadingWorkflows)
    );
    this.state.connect('workflows', this.store.select(selectWorkflows));
    this.events();
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
      .projectEvents<Task>('projecttasks.create')
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        this.store.dispatch(
          KanbanEventsActions.newTask({ task: msg.event.content })
        );
      });
  }

  private checkInviteModalStatus() {
    const state = window.history.state as { invite: boolean } | undefined;
    this.state.set({ invitePeopleModal: !!state?.invite });
  }
}
