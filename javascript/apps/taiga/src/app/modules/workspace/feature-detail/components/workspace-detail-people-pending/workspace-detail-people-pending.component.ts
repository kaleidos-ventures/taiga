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
  AfterContentInit,
} from '@angular/core';
import { InvitationWorkspaceMember, Workspace, User } from '@taiga/data';
import { RxState } from '@rx-angular/state';
import { Store } from '@ngrx/store';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/workspace/feature-detail/workspace-feature.constants';
import { map } from 'rxjs/operators';
import { filterNil } from '~/app/shared/utils/operators';
import {
  selectWorkspace,
  selectInvitationsList,
  selectInvitationsLoading,
  selectTotalInvitations,
  selectInvitationsOffset,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { workspaceDetailApiActions } from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import { slideInOut } from '~/app/shared/utils/animations';

@Component({
  selector: 'tg-workspace-detail-people-pending',
  templateUrl: './workspace-detail-people-pending.component.html',
  styleUrls: ['./workspace-detail-people-pending.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [slideInOut],
})
export class WorkspaceDetailPeoplePendingComponent
  implements OnInit, AfterContentInit
{
  public MEMBERS_PAGE_SIZE = MEMBERS_PAGE_SIZE;
  public model$ = this.state.select().pipe(
    map((model) => {
      const invitationMembers = model.invitationMembers.slice(
        model.offset,
        model.offset + MEMBERS_PAGE_SIZE
      );

      const pageStart = model.offset + 1;
      const pageEnd = pageStart + invitationMembers.length - 1;

      return {
        ...model,
        pageStart,
        pageEnd,
        hasNextPage: pageEnd < model.total,
        hasPreviousPage: !!model.offset,
        invitationMembers,
      };
    })
  );
  public animationDisabled = true;

  constructor(
    private state: RxState<{
      invitationMembers: InvitationWorkspaceMember[];
      loading: boolean;
      total: number;
      offset: number;
      workspace: Workspace | null;
    }>,
    private store: Store
  ) {}

  public ngOnInit(): void {
    this.state.connect(
      'invitationMembers',
      this.store.select(selectInvitationsList)
    );
    this.state.connect('loading', this.store.select(selectInvitationsLoading));
    this.state.connect('total', this.store.select(selectTotalInvitations));
    this.state.connect('offset', this.store.select(selectInvitationsOffset));
    this.state.connect(
      'workspace',
      this.store.select(selectWorkspace).pipe(filterNil())
    );
  }

  public ngAfterContentInit() {
    setTimeout(() => {
      this.animationDisabled = false;
    }, 1000);
  }

  public trackByIndex(index: number) {
    return index;
  }

  public trackByUserOrEmail(
    index: number,
    invitation: InvitationWorkspaceMember
  ) {
    return invitation.user?.username || invitation.email;
  }

  public next() {
    this.store.dispatch(
      workspaceDetailApiActions.getWorkspaceMemberInvitations({
        id: this.state.get('workspace')!.id,
        offset: this.state.get('offset') + MEMBERS_PAGE_SIZE,
      })
    );
  }

  public prev() {
    this.store.dispatch(
      workspaceDetailApiActions.getWorkspaceMemberInvitations({
        id: this.state.get('workspace')!.id,
        offset: this.state.get('offset') - MEMBERS_PAGE_SIZE,
      })
    );
  }

  public getUser(invitation: InvitationWorkspaceMember): Partial<User> {
    if (invitation.user) {
      return invitation.user;
    }
    return { email: invitation.email };
  }
}
