/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { User, Workspace } from '@taiga/data';
import {
  workspaceDetailApiActions,
  workspaceDetailEventActions,
} from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import {
  selectTotalMembers,
  selectTotalNonMembers,
  selectWorkspace,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { WsService } from '~/app/services/ws';
import { filterNil } from '~/app/shared/utils/operators';

interface WorkspaceDetailState {
  workspace: Workspace | null;
  totalMembers: number;
  totalNonMembers: number;
}
@UntilDestroy()
@Component({
  selector: 'tg-workspace-detail-people',
  templateUrl: './workspace-detail-people.component.html',
  styleUrls: ['./workspace-detail-people.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class WorkspaceDetailPeopleComponent implements OnInit {
  public model$ = this.state.select();
  public selectedTab = 1;
  public invitePeople = false;
  public resetForm = false;

  constructor(
    private state: RxState<WorkspaceDetailState>,
    private store: Store,
    private wsService: WsService
  ) {}

  public ngOnInit(): void {
    this.state.connect(
      'workspace',
      this.store.select(selectWorkspace).pipe(filterNil())
    );
    this.state.connect('totalMembers', this.store.select(selectTotalMembers));
    this.state.connect(
      'totalNonMembers',
      this.store.select(selectTotalNonMembers)
    );

    this.state.hold(this.state.select('workspace'), (workspace) => {
      if (workspace) {
        this.store.dispatch(
          workspaceDetailApiActions.initWorkspacePeople({
            id: workspace.id,
          })
        );
      }
    });

    this.events();
  }

  public events() {
    const workspace = this.state.get('workspace');

    if (workspace) {
      this.wsService
        .command('subscribe_to_workspace_events', {
          workspace: workspace.id,
        })
        .subscribe();

      this.wsService
        .events<{
          membership: {
            user: User;
            workspace: Workspace;
          };
        }>({
          channel: `workspaces.${workspace.id}`,
          type: 'workspacememberships.delete',
        })
        .pipe(untilDestroyed(this))
        .subscribe((eventResponse) => {
          this.store.dispatch(
            workspaceDetailEventActions.removeMember({
              id: workspace.id,
              username: eventResponse.event.content.membership.user.username,
            })
          );
        });
    }
  }

  public invitePeopleModal() {
    this.resetForm = this.invitePeople;
    this.invitePeople = !this.invitePeople;
  }

  public onInviteSuccess() {
    // init members
  }
}
