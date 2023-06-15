/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, concatLatestFrom, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { User, Workspace, Project } from '@taiga/data';
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

@UntilDestroy()
@Component({
  selector: 'tg-workspace-detail-people',
  templateUrl: './workspace-detail-people.component.html',
  styleUrls: ['./workspace-detail-people.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class WorkspaceDetailPeopleComponent implements OnInit {
  @Input() public id!: Workspace['id'];

  public selectedTab = 1;
  public invitePeople = false;
  public resetForm = false;

  public workspace = this.store.selectSignal(selectWorkspace);
  public totalMembers = this.store.selectSignal(selectTotalMembers);
  public totalInvitationMembers = this.store.selectSignal(
    selectTotalInvitations
  );
  public totalNonMembers = this.store.selectSignal(selectTotalNonMembers);
  public invitationsOffset = this.store.selectSignal(selectInvitationsOffset);

  constructor(
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
            id: this.id,
            offset: 0,
          })
        );
      });
  }

  public ngOnInit(): void {
    if (this.id) {
      this.store.dispatch(
        workspaceDetailApiActions.initWorkspacePeople({
          id: this.id,
        })
      );
    }

    this.events();
  }

  public events() {
    if (this.id) {
      this.wsService
        .command('subscribe_to_workspace_events', {
          workspace: this.id,
        })
        .subscribe();

      this.wsService
        .events<{
          membership: {
            user: User;
            workspace: Workspace;
          };
        }>({
          channel: `workspaces.${this.id}`,
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
              id: this.id,
              username: eventResponse.event.content.membership.user.username,
            })
          );
        });

      this.wsService
        .events<{ workspace: string }>({
          channel: `workspaces.${this.id}`,
          type: 'workspacememberships.create',
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.store.dispatch(
            workspaceDetailEventActions.updateMembersInvitationsList({
              id: this.id,
            })
          );
        });

      this.wsService
        .events<{ workspace: string }>({
          channel: `workspaces.${this.id}`,
          type: 'workspaceinvitations.create',
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.store.dispatch(
            workspaceDetailEventActions.updateNonMembersInvitationsList({
              id: this.id,
            })
          );
        });

      this.wsService
        .events<{ workspace: string }>({
          channel: `workspaces.${this.id}`,
          type: 'workspaceinvitations.update',
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.store.dispatch(
            workspaceDetailEventActions.updateInvitationsList({
              id: this.id,
            })
          );
        });

      this.wsService
        .events<{ workspace: string }>({
          channel: `workspaces.${this.id}`,
          type: 'projectmemberships.create',
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.store.dispatch(
            workspaceDetailEventActions.updateMembersNonMembersProjects({
              id: this.id,
            })
          );
        });

      this.wsService
        .events<{
          membership: {
            user: Pick<User, 'username' | 'fullName' | 'color'>;
            project: Project;
          };
          workspace: Workspace['id'];
        }>({
          channel: `workspaces.${this.id}`,
          type: 'projectmemberships.delete',
        })
        .pipe(untilDestroyed(this))
        .subscribe((eventResponse) => {
          this.store.dispatch(
            workspaceDetailEventActions.updateMembersNonMembersProjects({
              id: eventResponse.event.content.workspace,
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
