/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, concatLatestFrom, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { User, Workspace } from '@taiga/data';
import { filter } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import {
  workspaceDetailApiActions,
  workspaceDetailEventActions,
} from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import {
  selectTotalMembers,
  selectTotalNonMembers,
  selectWorkspace,
  selectTotalInvitations,
  selectInvitationsOffset,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { WsService } from '~/app/services/ws';
import { filterNil } from '~/app/shared/utils/operators';
import { invitationWorkspaceActions } from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';

interface WorkspaceDetailState {
  workspace: Workspace | null;
  totalMembers: number;
  totalNonMembers: number;
  totalInvitationMembers: number;
  invitationsOffset: number;
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
    private wsService: WsService,
    private actions$: Actions
  ) {
    this.actions$
      .pipe(
        ofType(invitationWorkspaceActions.inviteUsersSuccess),
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.store.dispatch(
          workspaceDetailApiActions.getWorkspaceMemberInvitations({
            id: this.state.get('workspace')!.id,
            offset: 0,
          })
        );
      });
  }

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
    this.state.connect(
      'totalInvitationMembers',
      this.store.select(selectTotalInvitations)
    );
    this.state.connect(
      'invitationsOffset',
      this.store.select(selectInvitationsOffset)
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
        .pipe(
          untilDestroyed(this),
          concatLatestFrom(() =>
            this.store.select(selectUser).pipe(filterNil())
          ),
          filter(([eventResponse, user]) => {
            return (
              eventResponse.event.content.membership.user.username !==
              user.username
            );
          })
        )
        .subscribe(([eventResponse]) => {
          this.store.dispatch(
            workspaceDetailEventActions.removeMember({
              id: workspace.id,
              username: eventResponse.event.content.membership.user.username,
            })
          );
        });

      this.wsService
        .events<{ workspace: string }>({
          channel: `workspaces.${workspace.id}`,
          type: 'workspacememberships.create',
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.store.dispatch(
            workspaceDetailEventActions.updateMembersList({
              id: workspace.id,
            })
          );
        });

      this.wsService
        .events<{ workspace: string }>({
          channel: `workspaces.${workspace.id}`,
          type: 'workspaceinvitations.create',
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.store.dispatch(
            workspaceDetailEventActions.updateInvitationsList({
              id: workspace.id,
            })
          );
        });

      this.wsService
        .events<{ workspace: string }>({
          channel: `workspaces.${workspace.id}`,
          type: 'projectmemberships.create',
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.store.dispatch(
            workspaceDetailEventActions.updateNonMembersList({
              id: workspace.id,
            })
          );
        });
    }
  }

  public invitePeopleModal() {
    this.resetForm = this.invitePeople;
    this.invitePeople = !this.invitePeople;
  }
}
